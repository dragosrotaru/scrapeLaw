const composeProfileUrl = (profileSlug: string) => `https://isba.reliaguide.com/api/public/profiles/${profileSlug}`;

const fetchProfile = async (url: string) => {
    const response = await fetch(url);
    return await response.json();
};

