const MAX_PAGE_SIZE = 20;

const composeIndexUrl = (page: number) => `https://isba.reliaguide.com/api/public/profiles?memberTypeId.equals=1&page=${page}&size=${MAX_PAGE_SIZE}`;
