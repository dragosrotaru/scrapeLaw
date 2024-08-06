// 3rd Party
import { decode } from "html-entities";
import parsePhoneNumber from "libphonenumber-js";
import validator from "validator";
import normalizeEmail from "normalize-email";
import { parse, format, isValid, parseISO } from "date-fns";

// Utility
import type { NullableString } from "./types.mts";


// todo issue with DENO
// import { Client as GoogleMapsClient } from "@googlemaps/google-maps-services-js";

const GOOGLE_MAPS_API_KEY = "";
// const gmClient = new GoogleMapsClient({});

/**
 * normalize html to a standard format
 * @param html
 * @returns
 */
export function htmlToHTML(html: NullableString): NullableString {
  if (html === "") return null;
  return html;
}

/**
 * normalize text to a standard format
 */
export function htmlToText(html: NullableString): NullableString {
  if (html === null) return null;
  // decode html entities
  let text = decode(html);

  // replace br tags with newlines
  text = text.replace(/<br\s*[/]?>/gi, "\n");

  // remove tags
  text = text.replace(/<[^>]*>/g, "");

  // normalize whitespace, /t, /n, /r, etc.
  text = text.replace(/\s+/g, " ").trim();

  // if the text is empty or some other form of null value, return null
  if (text === "") return null
  if (text ==="null") return null
  if (text === "undefined") return null
  if (text === "N/A") return null
  if (text === "n/a") return null 

  return text;
}

/**
 * normalize person names to a standard format
 * @param html
 * @returns
 */
export function htmlToPersonName(html: NullableString): NullableString {
    let text = htmlToText(html);
    if (text === null) return null;
    // Standardize the capitalization of the name
    text = text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    return text;
}

export function manitobaPersonName(html: NullableString): NullableString {
  let name = htmlToPersonName(html);
  if (name === null) return null;
  // strip (KC) if present
  name = name.replace(/\s*\(KC\)/, "");
  // Last, Jr., First
  const parts = name.split(",");
  if (parts.length === 1) return name;
  if (parts.length === 2) return `${parts[1].trim()} ${parts[0].trim()}`;
  if (parts.length === 3) return `${parts[2].trim()} ${parts[0].trim()} ${parts[1].trim()}`;
  return null;
}

/**
 * normalize phone numbers to a standard format
 * @param text
 * @returns
 */
export function htmlToPhone(html: NullableString): NullableString {
  const text = htmlToText(html);
  if (text === null) return null;
  // remove all non-digit characters
  const phone = parsePhoneNumber(text);
  return phone ? phone.formatInternational() : null;
}

/**
 * normalize emails to a standard format
 * @param email
 * @returns
 */
export function htmlToEmail(html: NullableString): NullableString {
  const text = htmlToText(html);
  if (text === null) return null;
  if (validator.isEmail(text)) {
    return normalizeEmail(text);
  } else {
    return null; // Invalid email
  }
}

/**
 * normalize dates to a standard format
 * @param html
 * @param inputFormat
 * @returns
 */
export function htmlToDate(html: NullableString, inputFormat = "yyyy-MM-dd"): NullableString {
  const text = htmlToText(html);
  if (text === null) return null;

  let date = parseISO(text);
  if (isValid(date)) return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

  const formats = [
    inputFormat,
    "dd-MM-yyyy",
    "MM/dd/yyyy",
    "dd/MM/yyyy",
    "yyyy/MM/dd",
    "dd.MM.yyyy",
    "MM.dd.yyyy",
    "MMMM d, yyyy",
    "d MMMM yyyy",
    "yyyy MMMM d",
    "EEE, d MMM yyyy",
  ];

  for (const fmt of formats) {
    date = parse(text, fmt, new Date());
    if (isValid(date)) return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
  }

  return null;
}

/**
 * normalize URLs to a standard format
 * @param html
 * @returns
 */
export function htmlToURL(html: NullableString): NullableString {
  try {
    // Parse the URL
    const text = htmlToText(html);
    if (text === null) return null;
    const parsedUrl = new URL(text);

    // Convert the hostname to lowercase
    parsedUrl.hostname = parsedUrl.hostname.toLowerCase();

    // Remove 'www.' if present
    if (parsedUrl.hostname.startsWith("www.")) {
      parsedUrl.hostname = parsedUrl.hostname.slice(4);
    }

    // Remove default ports
    if (
      (parsedUrl.protocol === "http:" && parsedUrl.port === "80") ||
      (parsedUrl.protocol === "https:" && parsedUrl.port === "443")
    ) {
      parsedUrl.port = "";
    }

    // Sort query parameters
    const searchParams = new URLSearchParams(parsedUrl.search);
    parsedUrl.search = [...searchParams.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&");

    // Remove trailing slash from path if present (unless it's the only character in the path)
    if (parsedUrl.pathname.length > 1 && parsedUrl.pathname.endsWith("/")) {
      parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
    }

    // Remove default file names like index.html
    const defaultFiles = ["index.html", "index.htm", "index.php", "index.asp"];
    for (const file of defaultFiles) {
      if (parsedUrl.pathname.toLowerCase().endsWith("/" + file)) {
        parsedUrl.pathname = parsedUrl.pathname.slice(0, -file.length);
      }
    }

    // Convert to string and remove trailing slash if present
    let normalizedUrl = parsedUrl.toString();
    if (normalizedUrl.endsWith("/")) {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }

    return normalizedUrl;
  } catch (error) {
    // If parsing fails, return the original URL
    console.error("Error normalizing URL:", error);
    return null;
  }
}

/**
 * normalize domains to a standard format
 * @param html
 * @returns
 */
export function htmlToDomain(html: NullableString): NullableString {
  try {
    let url = htmlToURL(html);
    if (url === null) return null;
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    console.error("Error extracting domain:", error);
    return null;
  }
}

/**
 * convert email to domain
 * @param email
 * @returns
 */
export function emailToDomain(email: NullableString): NullableString {
  try {
    if (email === null) return null;
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email format");
    }

    // Split the email at '@' and return the second part
    const [, domain] = email.split("@");

    return domain;
  } catch (error) {
    console.error("Error extracting domain from email:", error);
    return null;
  }
}

export interface Address {
  formattedAddress: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

/**
 * normalize addresses to a standard format
 * @param html 
 * @returns 
 */
/* async function htmlToAddress(html: string): Promise<Address | null> {
  try {
    const text = htmlToText(html);
    const response = await gmClient.geocode({
      params: {
        address: text,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.results.length > 0) {
      const result = response.data.results[0];
      const addressComponents = result.address_components;
      const location = result.geometry.location;

      const getAddressComponent = (type: any) => {
        const component = addressComponents.find(comp => comp.types.includes(type));
        return component ? component.long_name : '';
      };

      const address: Address = {
        formattedAddress: result.formatted_address,
        street: `${getAddressComponent('street_number')} ${getAddressComponent('route')}`.trim(),
        city: getAddressComponent('locality'),
        state: getAddressComponent('administrative_area_level_1'),
        country: getAddressComponent('country'),
        postalCode: getAddressComponent('postal_code'),
        latitude: location.lat,
        longitude: location.lng,
      };

      return address;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch geocode information");
  }
} */