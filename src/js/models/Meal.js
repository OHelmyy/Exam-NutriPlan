export class Meal {
  constructor(data = {}) {
    this.id = data.id || '';
    this.name = data.name || 'Unnamed Recipe';
    this.category = data.category || 'Miscellaneous';
    this.area = data.area || 'Unknown';
    this.thumbnail = data.thumbnail || './src/images/favicon.png';
    this.instructions = Array.isArray(data.instructions) ? data.instructions : [];
    this.ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
    this.youtube = data.youtube || '';
    this.tags = Array.isArray(data.tags) ? data.tags : [];
  }

  // Converts a regular YouTube link into an embed link so it can play in an <iframe>
  getYoutubeEmbedUrl() {
    if (!this.youtube) return '';

    // Example link: "https://www.youtube.com/watch?v=4aZr5hZXP_s"
    // Splitting by "v=" gives us ["https://www.youtube.com/watch?", "4aZr5hZXP_s"]
    const videoId = this.youtube.split('v=')[1];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return '';
  }
}
