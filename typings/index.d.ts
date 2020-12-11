declare module 'ytpl' {
  namespace ytpl {
    interface options {
      /** Limits the pulled items. */
      limit?: number;
      /** Limits the pulled pages - overwrites limit. */
      pages?: number;
      /** Request Options for Miniget */
      requestOptions?: { headers?: { [key: string]: string; }};
    }
    interface image {
      url: string;
      width: number;
      height: number;
    }
    interface item {
      title: string;
      index: number;
      id: string;
      shortUrl: string;
      url: string;
      author: {
        name: string;
        ref: string;
        channelID: string;
      };
      thumbnails: image[];
      bestThumbnail: image;
      isLive: boolean;
      duration: string | null;
      durationSec: number | null;
    }
    interface result {
      id: string;
      url: string;
      title: string;
      estimated_items: number;
      views: number;
      thumbnails: image[],
      bestThumbnail: image,
      lastUpdated: string;
      description: string | null;
      visibility: 'unlisted' | 'everyone';
      author: {
        name: string;
        ref: string;
        avatars: image[];
        bestAvatar: image;
        channelID: string;
      };
      items: item[];
      continuation: [string, string, object, object] | null;
    }
    interface continueResult {
      continuation: [string, string, object, object] | null,
      items: item[],
    }

    /**
     * @param link Link to validate
     * @description Returns true if able to parse out a (formally) valid playlist ID. Does no requests to the youtube webservers.
     */
    function validateID(link: string): boolean;

    /**
     * @param link YouTube URL
     * @description Returns a promise that resovles to the playlist ID from a YouTube URL. Can be called with the playlist ID directly, in which case it returns it.
     */
    function getPlaylistID(link: string): Promise<string>;

    /**
     * @param continuationData Data provided from a previous request
     * @description fetches one additional page & parses its items - only supported when using pages
     */
    function continueReq(continuationData: [string, string, object, object]): Promise<continueResult>;
  }

  /**
   * @description Attempts to resolve the given playlist id
   * @param id Can be the id of the YT playlist or playlist link or user link (resolves uploaded playlist) or channel link (resolves uploaded playlist)
   * @param [options] Object with options.
   * @returns Promise that resolves to playlist data;
   */
  function ytpl(id: string, options?: ytpl.options): Promise<ytpl.result>;

  export = ytpl;
}
