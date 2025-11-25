function generateRandomString(length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

export const TIME_REPORT_LOAD: number = 15000; // set it depending on internet bandiwth, pc performance and server load
export const TIME_AFTER_UPLOAD: number = 3000;

export { generateRandomString };
