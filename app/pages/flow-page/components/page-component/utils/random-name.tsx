function generateRandomName(length: number = 8, extension: string = ''): string {

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (extension) {
      const ext = extension.startsWith('.') ? extension : `.${extension}`;
      return result + ext;
    }
    
    return result;
  }