from bs4 import BeautifulSoup
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import silhouette_score
from sklearn.cluster import KMeans
import json
import os
import sentencepiece as spm
from collections import defaultdict

# Custom Tokenizer

# Build a suffix array to detect longest repeated substrings
def build_suffix_array(text):
    suffixes = sorted((text[i:], i) for i in range(len(text)))
    return [suffix[1] for suffix in suffixes]

# Longest repeated substring using suffix array and LCP (Longest Common Prefix)
def longest_repeated_substrings(text, min_length=4):
    suffix_array = build_suffix_array(text)
    lcp = [0] * len(suffix_array)

    # Build the LCP array
    for i in range(1, len(suffix_array)):
        lcp_length = 0
        suffix_1 = suffix_array[i - 1]
        suffix_2 = suffix_array[i]
        while suffix_1 + lcp_length < len(text) and suffix_2 + lcp_length < len(text) and text[suffix_1 + lcp_length] == text[suffix_2 + lcp_length]:
            lcp_length += 1
        lcp[i] = lcp_length

    # Extract repeated substrings
    repeated_substrings = defaultdict(int)
    for i, length in enumerate(lcp):
        if length >= min_length:
            substring = text[suffix_array[i]:suffix_array[i] + length]
            repeated_substrings[substring] += 1

    return repeated_substrings

class CustomTokenizer:
    def __init__(self, repeated_substrings):
        self.substrings = sorted(repeated_substrings, key=len, reverse=True)

    def tokenize(self, text):
        tokens = []
        remaining_text = text
        while remaining_text:
            for substring in self.substrings:
                if remaining_text.startswith(substring):
                    tokens.append(substring)
                    remaining_text = remaining_text[len(substring):]
                    break
            else:
                tokens.append(remaining_text[0])
                remaining_text = remaining_text[1:]
        return tokens

    def fit_and_tokenize(self, text):
        return self.tokenize(text)

# Fit a custom tokenizer based on repeated substrings
def fit_custom_tokenizer(html_pages, min_length=4):
    full_corpus = ''.join(html_pages).lower()
    repeated_substrings = longest_repeated_substrings(full_corpus, min_length=min_length)
    tokenizer = CustomTokenizer(repeated_substrings)
    return tokenizer


# Tokenize HTML pages with a custom tokenizer
def tokenize_html_pages(html_pages, tokenizer):
    return [' '.join(tokenizer.fit_and_tokenize(page.lower())) for page in html_pages]

# Build TF-IDF matrix using custom tokenizer tokens
def build_custom_tfidf_matrix(html_pages, tokenizer):
    tokenized_texts = tokenize_html_pages(html_pages, tokenizer)
    vectorizer = TfidfVectorizer()
    return vectorizer.fit_transform(tokenized_texts)

# Save the vocabulary of repeated substrings
def save_vocabulary(repeated_substrings, output_file='vocab.json'):
    sorted_vocab = sorted(repeated_substrings.items(), key=lambda x: -len(x[0]))
    vocab = [{"token": token, "count": count} for token, count in sorted_vocab]
    with open(output_file, 'w') as f:
        json.dump(vocab, f, indent=4)


# SentencePiece

# vocabulary size estimation
def estimate_vocab_size(html_pages, scale_factor=8, min_size=32, max_size=200):
    unique_chars = set()
    for page in html_pages:
        unique_chars.update(page)
    vocab_size = max(min_size, min(max_size, len(unique_chars) * scale_factor))
    return vocab_size


# create a text corpus from HTML pages
def create_text_corpus(html_pages, corpus_file='html_corpus.txt'):
    with open(corpus_file, 'w') as f:
        for page in html_pages:
            f.write(page + '\n')

# train SentencePiece model
def train_sentencepiece(html_pages, model_prefix='html_bpe', vocab_size=32):
    corpus_file = 'html_corpus.txt'
    create_text_corpus(html_pages, corpus_file)
    spm.SentencePieceTrainer.train(
        input=corpus_file,
        model_prefix=model_prefix,
        vocab_size=vocab_size,
        character_coverage=1.0,
        model_type='bpe',
        max_sentence_length=4096,
        split_by_whitespace=False,
    )
    os.remove(corpus_file)

# build TF-IDF matrix using SentencePiece tokens
def build_sentencepiece_tfidf_matrix(html_pages, spm_model):
    tokenized_texts = [
        ' '.join(spm_model.encode_as_pieces(page))
        for page in html_pages
    ]
    vectorizer = TfidfVectorizer()
    return vectorizer.fit_transform(tokenized_texts)

# CLUSTERING

# estimate the optimal number of clusters
def estimate_optimal_clusters(tfidf_matrix, min_clusters=2, max_clusters=10):
    num_samples = tfidf_matrix.shape[0]
    max_clusters = min(max_clusters, num_samples - 1)
    min_clusters = max(min_clusters, 2)

    scores = []
    cluster_range = range(min_clusters, max_clusters + 1)

    for n_clusters in cluster_range:
        kmeans = KMeans(n_clusters=n_clusters)
        labels = kmeans.fit_predict(tfidf_matrix)
        score = silhouette_score(tfidf_matrix, labels)
        scores.append(score)

    optimal_clusters = cluster_range[scores.index(max(scores))]
    return optimal_clusters

# Function to cluster pages using TF-IDF matrix and select representative pages
def cluster_pages(html_pages, tfidf_matrix, n_clusters):
    kmeans = KMeans(n_clusters=n_clusters)
    clusters = kmeans.fit_predict(tfidf_matrix)
    cluster_map = {}
    
    for index, cluster in enumerate(clusters):
        if cluster not in cluster_map:
            cluster_map[cluster] = index

    return [html_pages[index] for index in cluster_map.values()]

def select_sample_set(html_pages, model_prefix='html_bpe', min_clusters=2, max_clusters=10):
    """ vocab_size = estimate_vocab_size(html_pages)
    train_sentencepiece(html_pages, model_prefix, vocab_size)
    spm_model = spm.SentencePieceProcessor(model_file=f'{model_prefix}.model')
    tfidf_matrix = build_sentencepiece_tfidf_matrix(html_pages, spm_model) """
    tokenizer = fit_custom_tokenizer(html_pages, 5)
    repeated_substrings = tokenizer.substrings
    save_vocabulary({substring: 1 for substring in repeated_substrings}, "vocab.json")
    tfidf_matrix = build_custom_tfidf_matrix(html_pages, tokenizer)
    n_clusters = estimate_optimal_clusters(tfidf_matrix, min_clusters, max_clusters)
    return cluster_pages(html_pages, tfidf_matrix, n_clusters)

# Read the HTML pages from the JSON file
def load_html_pages_from_json(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data['results']

# Save the representative pages to a JSON file
def save_representative_pages_to_json(representative_pages, output_file='subset.json'):
    with open(output_file, 'w') as f:
        json.dump(representative_pages, f, indent=4)


# Load HTML pages from `index.json`
html_pages = load_html_pages_from_json('index.json')

# Replace the function call with your `select_sample_set` call
representative_pages = select_sample_set(html_pages, model_prefix='html_bpe', min_clusters=2, max_clusters=10)
save_representative_pages_to_json(representative_pages, 'subset.json')