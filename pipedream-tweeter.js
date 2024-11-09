import { TwitterApi } from 'twitter-api-v2';
import fetch from 'node-fetch';

export default defineComponent({
  props: {
    // Define the confession text input field
    confession: {
      type: "string",
      label: "Confession Text",
      description: "Enter the confession to tweet (max 280 characters)"
    },
    // Define optional image URL input field
    imageUrl: {
      type: "string",
      label: "Image URL",
      description: "Optional: Enter URL of image to attach to tweet",
      optional: true
    }
  },

  async run({ steps, $ }) {
    // Initialize Twitter client
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    try {
      // Validate confession
      const trimmedConfession = this.confession.trim();
      if (trimmedConfession.length > 280) {
        throw new Error('Confession exceeds Twitter\'s 280 character limit');
      }

      // If imageUrl is provided, post tweet with image
      if (this.imageUrl) {
        try {
          // Log status for debugging
          $.export('status', 'Fetching image...');
          
          // Fetch and upload the image
          const imageResponse = await fetch(this.imageUrl);
          if (!imageResponse.ok) throw new Error('Failed to fetch image');
          const imageBuffer = await imageResponse.buffer();

          $.export('status', 'Uploading image to Twitter...');
          
          // Upload media to Twitter
          const mediaId = await client.v1.uploadMedia(imageBuffer, {
            type: 'image/png'  // Adjust if needed based on your image type
          });

          $.export('status', 'Posting tweet with image...');
          
          // Post tweet with media
          const tweet = await client.v2.tweet({
            text: trimmedConfession,
            media: {
              media_ids: [mediaId]
            }
          });

          return {
            success: true,
            tweetId: tweet.data.id,
            message: 'Successfully posted tweet with image',
            imageIncluded: true,
            tweetUrl: `https://twitter.com/i/web/status/${tweet.data.id}`
          };
        } catch (imageError) {
          console.error('Image processing failed:', imageError);
          // If image fails, fall back to text-only tweet
          $.export('status', 'Image processing failed, falling back to text-only tweet...');
        }
      }

      $.export('status', 'Posting text-only tweet...');
      
      // Post text-only tweet (either no image provided or image processing failed)
      const tweet = await client.v2.tweet({
        text: trimmedConfession
      });

      return {
        success: true,
        tweetId: tweet.data.id,
        message: 'Successfully posted tweet',
        imageIncluded: false,
        tweetUrl: `https://twitter.com/i/web/status/${tweet.data.id}`
      };

    } catch (error) {
      console.error('Error in Twitter step:', error);
      throw new Error(`Failed to post tweet: ${error.message}`);
    }
  },
})