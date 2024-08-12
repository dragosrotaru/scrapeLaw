
import cheerio from "cheerio";
import fs from "fs";

function extractData(html) {
    const $ = cheerio.load(html);
    const container = $('.inner_body_info_row');
    const name = container.find('h3').first().text().trim();
    
    let image = container.find('img').attr('src');
    if (image === '/../../../../assets/website/img/contact_default.png') {
      image = null;
    } else if (image) {
      image = encodeURI('https://cpbcan.ca' + image);
    }
    
    const locationElement = container.find('.col-lg-4:contains("Location")');
    let location = locationElement.text().replace('Location', '').trim().replace(/\s+/g, ' ').trim();

    if (location === ",") {
        location = null;
    }
    
    const contactElement = container.find('.col-lg-4:contains("Contact")');
    const contactText = contactElement.text();
    
    // split by Company:
    const contactParts = contactText.split('Company:');
    
    // Extract phone by removing everything that is not a number
    const phone = contactParts[0].replace(/\D/g, '');
    
    // Extract company
    const company = contactParts[1].split('Email:')[0].trim();
    
    const email = contactElement.find('a').attr('href')?.replace('mailto:', '').trim() || null;
    
    const certElement = container.find('.col-lg-4:contains("Certification Pathway Level")');
    const cert = certElement.text().replace('Certification Pathway Level', '').trim();
    
    const expertiseElement = container.find('.col-lg-4:contains("Accounting Platform Expertise")');
    const expertise = expertiseElement.find('.text-highlight').map((_, el) => $(el).text().trim()).get();
    
    const certificationsElement = container.find('.col-lg-4:contains("Software Certifications")');
    const certifications = certificationsElement.find('.text-highlight').map((_, el) => $(el).text().trim()).get();
    
    const websiteElement = container.find('.col-lg-4:contains("Website")');
    const website = websiteElement.find('a').attr('href') || null;
    
    const bioElement = container.find('.col-lg-12:contains("Bio")');
    const bio = bioElement.find('span').text().trim() || null;
  
    return {
      name,
      image,
      location,
      phone,
      company,
      email,
      cert,
      expertise,
      certifications,
      website,
      bio
    };
  }

function extractData3(html) {
    const $ = cheerio.load(html);
    const container = $('.inner_body_info_row');
    const name = container.find('h3').first().text().trim();
    
    let image = container.find('img').attr('src');
    if (image === '/../../../../assets/website/img/contact_default.png') {
      image = null;
    } else if (image) {
      image = encodeURI('https://cpbcan.ca' + image);
    }
    
    const locationElement = container.find('.col-lg-4:contains("Location")');
    const location = locationElement.text().replace('Location', '').trim().replace(/\s+/g, ' ');
    
    const contactElement = container.find('.col-lg-4:contains("Contact")');
    const phone = contactElement.text().match(/Phone\s*:\s*(.*)/)?.[1]?.trim() || '';
    const company = contactElement.text().match(/Company:\s*(.*)/)?.[1]?.trim() || '';
    const email = contactElement.find('a').attr('href')?.replace('mailto:', '').trim() || '';
    
    const certElement = container.find('.col-lg-4:contains("Certification Pathway Level")');
    const cert = certElement.text().replace('Certification Pathway Level', '').trim();
    
    const expertiseElement = container.find('.col-lg-4:contains("Accounting Platform Expertise")');
    const expertise = expertiseElement.find('.text-highlight').map((_, el) => $(el).text().trim()).get();
    
    const certificationsElement = container.find('.col-lg-4:contains("Software Certifications")');
    const certifications = certificationsElement.find('.text-highlight').map((_, el) => $(el).text().trim()).get();
    
    const websiteElement = container.find('.col-lg-4:contains("Website")');
    const website = websiteElement.find('a').attr('href') || '';
    
    const bioElement = container.find('.col-lg-12:contains("Bio")');
    const bio = bioElement.find('span').text().trim();
  
    return {
      name,
      image,
      location,
      phone,
      company,
      email,
      cert,
      expertise,
      certifications,
      website,
      bio
    };
  }

function extractData2(html) {
  const $ = cheerio.load(html);
  const container = $('#app-container');

  const name = container.find('h3').first().text().trim();
  let image = container.find('img').attr('src');
  // if /../../../../assets/website/img/contact_default.png is the image source, set it to null
    if (image === '/../../../../assets/website/img/contact_default.png') {
        image = null;
    }
    // if image source is not null, prepend the base url
    if (image) {
        image = encodeURI('https://cpbcan.ca' + image);
    }

  let location = container.find('.col-lg-4:nth-child(1)').text().replace('Location', '').trim();
  // normalize whitespace in location
  location = location.replace(/\s+/g, ' ');
  
  const contactInfo = container.find('.col-lg-4:nth-child(2)').text().trim().split('\n');
  const phone = contactInfo[2].replace('Phone :', '').trim();
  const company = contactInfo[3].replace('Company:', '').trim();
  const email = container.find('.col-lg-4:nth-child(2) a').attr('href').replace('mailto:', '').trim();
  
  const cert = container.find('.col-lg-4:nth-child(3)').text().replace('Certification Pathway Level', '').trim();

  return {
    name,
    image,
    location,
    phone,
    company,
    email,
    cert
  };
}

async function extract() {
    const data = [];
    // iterate over all files in detail folder
    const files = fs.readdirSync('detail');
    for (const file of files) {
        const id = file.replace('.html', '');
        const html = fs.readFileSync(`detail/${file}`, 'utf8');
        const jsonData = extractData(html);
        jsonData.id = id;
        data.push(jsonData);
    }
    // save data to file
    fs.writeFileSync('data.json', JSON.stringify(data, null, 4));

}

extract();