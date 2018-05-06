declare module 'ytpl' {
  namespace ytpl{
    type options = {
      /** Limits the pulled items. */
      limit?:number
    }
    type result = {
      id:string
      url:string
      title:string
      visibility:string
      description:string
      total_items:number
      views:string
      last_updated:string
      author:{
        id:string
        name:string
        avatar:string
        user:string
        channel_url:string
        user_url:string
      }
      items:{
        id:string
        url:string
        url_simple:string
        title:string
        thumbnail:string
        duration:string
        author:{
          id:string
          name:string
          user:string
          channel_url:string
          user_url:string
        }
      }[]
    }
  }
  function ytpl(id:string,callback:((err:Error,result:ytpl.result)=>any)):void
  function ytpl(id:string,options:ytpl.options,callback:((err:Error,result:ytpl.result)=>any)):void
  function ytpl(id:string):Promise<ytpl.result>
  function ytpl(id:string,options:ytpl.options):Promise<ytpl.result>
  export = ytpl;
}
