const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Access-Control-Allow-Origin":"https://cookipie.github.io","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Authorization"}});
const SUPABASE_URL="https://htnziffczbgmaikzfiov.supabase.co";
const SUPABASE_KEY="sb_publishable_sIFiT_rsIK2Eqa_RzkOvpQ_5RqTz5X0";
async function getUser(request){const token=(request.headers.get("Authorization")||"").match(/^Bearer\s+(.+)$/i)?.[1];if(!token)return null;try{const r=await fetch(SUPABASE_URL+"/auth/v1/user",{headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+token}});if(!r.ok)return null;return await r.json()}catch{return null}}
function admin(user,env){const allowed=String(env.COOKIPIE_ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);return !!user?.email&&allowed.includes(user.email.toLowerCase())}
function toBase64(bytes){let binary="";const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));return btoa(binary)}
export async function onRequest({request,env}){
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":"https://cookipie.github.io","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Authorization","Access-Control-Max-Age":"86400"}});
  if(request.method!=="POST")return json({error:"method_not_allowed"},405);
  const user=await getUser(request);
  if(!admin(user,env))return json({error:user?"admin_only":"login_required"},user?403:401);
  if(!env.GITHUB_TOKEN)return json({error:"github_storage_not_configured"},503);
  const type=(request.headers.get("Content-Type")||"").toLowerCase();
  if(!type.includes("multipart/form-data"))return json({error:"multipart_required"},415);
  try{
    const form=await request.formData();
    const file=form.get("image");
    if(!file||typeof file.arrayBuffer!=="function")return json({error:"image_required"},400);
    const allowedTypes={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif"};
    const ext=allowedTypes[file.type];
    if(!ext)return json({error:"unsupported_image_type"},415);
    if(file.size<1||file.size>5*1024*1024)return json({error:"image_must_be_under_5mb"},413);
    const key=crypto.randomUUID()+"."+ext;
    const bytes=new Uint8Array(await file.arrayBuffer());
    const apiUrl="https://api.github.com/repos/cookipie/cookipie.github.io/contents/assets/recipe-images/"+key;
    const upload=await fetch(apiUrl,{method:"PUT",headers:{"Accept":"application/vnd.github+json","Authorization":"Bearer "+env.GITHUB_TOKEN,"X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json","User-Agent":"Cookipie-Recipe-Manager"},body:JSON.stringify({message:"Add recipe image "+key,content:toBase64(bytes),branch:"main"})});
    if(!upload.ok){let code="github_upload_failed";try{const details=await upload.json();if(details?.message==="Not Found")code="github_token_permission_or_repository_error";else if(upload.status===401||upload.status===403)code="github_token_permission_error"}catch{}return json({error:code},upload.status===401||upload.status===403?502:500)}
    return json({ok:true,key,url:"https://cookipie.github.io/assets/recipe-images/"+key});
  }catch{return json({error:"image_upload_failed"},500)}
}
