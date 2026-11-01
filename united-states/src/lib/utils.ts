export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const randomDelay = (min: number, max: number) => {
  const delayTime = Math.floor(Math.random() * (max - min + 1)) + min;
  return delay(delayTime);
};