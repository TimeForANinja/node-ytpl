declare module 'ytpl' {
  namespace ytpl {
    interface Options {
      /** Limits the pulled items. */
      limit?: number;
      /** Limits the pulled pages - overwrites limit. */
      pages?: number;
      /** Location setting */
      gl?: string;
      hl?: string;
      /** Request Options for Miniget */
      requestOptions?: { [key: string]: object; } & { headers?: { [key: string]: string; } };
    }

    interface ContinueResult {
      continuation: Continuation | null;
      items: Item[];
    }

    interface Continuation {}

    interface Image {
      url: string | null;
      width: number;
      height: number;
    }

    interface Item {
      title: string;
      index: number;
      id: string;
      shortUrl: string;
      url: string;
      author: {
        name: string;
        url: string;
        channelID: string;
      };
      thumbnails: Image[];
      bestThumbnail: Image;
      isLive: boolean;
      duration: string | null;
      durationSec: number | null;
    }

    interface Result {
      id: string;
      url: string;
      title: string;
      estimatedItemCount: number;
      views: number;
      thumbnails: Image[];
      bestThumbnail: Image;
      lastUpdated: string;
      description: string | null;
      visibility: 'unlisted' | 'everyone';
      author: {
        name: string;
        url: string;
        avatars: Image[];
        bestAvatar: Image;
        channelID: string;
      };
      items: Item[];
      continuation: Continuation | null;
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
    function continueReq(continuationData: Continuation): Promise<ContinueResult>;

    const version: string;
  }

  /**
   * @description Attempts to resolve the given playlist id
   * @param id Can be the id of the YT playlist or playlist link or user link (resolves uploaded playlist) or channel link (resolves uploaded playlist)
   * @param [options] Object with options.
   * @returns Promise that resolves to playlist data;
   */
  function ytpl(id: string, options?: ytpl.Options): Promise<ytpl.Result>;

  export = ytpl;
}
