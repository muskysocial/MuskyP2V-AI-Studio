import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "./api.js";

const app = document.querySelector("#app");
const tools = [
  {id:"canva",name:"Canva Me",desc:"Design and create stunning graphics",icon:"palette",accent:"canva",kind:"design"},
  {id:"headswap",name:"Image HeadSwap",desc:"Swap faces in photos",icon:"scan-face",accent:"head",kind:"image"},
  {id:"videoswap",name:"Video Face Swap",desc:"Swap faces in videos",icon:"clapperboard",accent:"video",kind:"video"},
  {id:"format",name:"Format",desc:"Convert, compress and resize files",icon:"folder-symlink",accent:"format",kind:"files"},
  {id:"social",name:"All Social Media Platform",desc:"Manage and grow across social platforms",icon:"smartphone",accent:"social",kind:"social"},
  {id:"shipment-room",name:"Shipment Journey",desc:"Create and share animated shipment tracking",icon:"truck",accent:"shipment",kind:"logistics"}
];
const moreTools = [
  ["AI Video","video"],["AI Image","image"],["Background Remover","scissors"],["Photo Enhancer","sparkles"],["AI Avatar","user-round"],["Voice Generator","mic"],["Music Generator","music"],["Image to Video","film"],["AI Art Creator","wand-sparkles"],["Video Enhancer","clapperboard"],["Caption Writer","pen-line"],["More tools","plus"]
];
let page = "Home";
let activeTool = null;
let messages = [];
let sessionState = "checking";
let currentUser = null;
let walletBalance = 0;
let membershipInfo = null;
let dailyClaimAvailable = false;
let dailyCoinClaiming = false;
let dailyCoinMessage = "";
let workspaceStateRestored = false;
let pendingSocialSelection = [];
let authMode = "login";
let authNotice = "";
let pendingPhone = "";
let selectedFile = null;
let selectedAssetFile = null;
let selectedReferenceFace = null;
let selectedTargetImage = null;
let workspaceResultUrl = "";
let referencePreviewUrl = "";
let targetPreviewUrl = "";
let selectedReferenceAssetId = "";
let selectedTargetAssetId = "";
let userProjects = [];
let userAssets = [];
let walletTransactions = [];
let userSupportTickets = [];
let workspaceBusy = false;
let workspaceNotice = "";
let videoDiagnosticResult = null;
let piapiDiagnosticResult = null;
let dailyVideoCredits = 100;
let selectedVideoFile = null;
let videoPreviewUrl = "";
let videoDurationSeconds = 5;
let videoAspectRatio = "16:9";
let activeVideoJobId = null;
let videoPollingToken = 0;
let videoPromptText = "";
let currentProjectId = null;
let dismissedRecentAssetIds = new Set();
let developerKeys = [];
let developerUsage = null;
let developerNewKey = "";
let developerError = "";
let developerLoading = false;
let developerLoaded = false;
let shipmentPhotoFiles = [];
let shipmentVideoFile = null;
let shipmentCreated = null;
let shipmentBusy = false;
let shipmentNotice = "";
let publicShipmentData = null;
let publicShipmentError = "";
let publicShipmentPassword = "";
let shipmentOwnerMessages = [];
let userShipments = [];
let shipmentRefreshTimer = null;
let isAdmin = false;
let adminDashboardData = null;
let adminDashboardLoading = false;
let adminDashboardError = "";
let activeAdminRoom = "Overview";
let selectedAdminUploadFile = null;
let adminUploadBusy = false;
let adminUploadNotice = "";
let adminCampaigns = [];
let adminCampaignLoading = false;
let adminCampaignNotice = "";
let editingCampaign = null;
let publicCampaigns = [];
let publicCampaignsLoaded = false;
let welcomeCampaignShown = (()=>{try{return sessionStorage.getItem("mh_welcome_campaign_seen")==="1";}catch{return false;}})();

// Do not block module startup on Supabase session recovery. The old top-level
// await left the HTML boot screen visible indefinitely when auth was slow/offline.
async function initializeAppAuth(){
  app.dataset.backend = "configured";
  app.dataset.auth = "checking";
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    if (currentUser) {
      restoreWorkspaceState();
      render();
      loadAccountData().then(()=>verifyReturnedPayment()).catch(error=>console.warn("Account startup:",error));
      refreshAdminAccess().then(()=>{sendVisitorHeartbeat();render();});
    } else {
      isAdmin=false;
      adminDashboardData=null;
      sendVisitorHeartbeat();
      sessionState = "signed-out";
      app.dataset.auth = sessionState;
      render();
    }
  });
  try {
    const timeout = new Promise(resolve=>setTimeout(()=>resolve({timedOut:true}),8000));
    const result = await Promise.race([supabase.auth.getSession(),timeout]);
    if(result?.timedOut){
      sessionState = "unknown";
      app.dataset.auth = sessionState;
      console.warn("Supabase session check timed out; showing sign-in instead of blocking startup.");
    } else {
      const {data,error} = result;
      sessionState = error ? "unknown" : (data.session ? "signed-in" : "signed-out");
      currentUser = data.session?.user || null;
      app.dataset.auth = sessionState;
      if(currentUser){
        restoreWorkspaceState();
        render();
        loadAccountData().then(()=>verifyReturnedPayment()).catch(error=>console.warn("Account startup:",error));
      }
      if(error) console.warn("Auth session check:",error.message);
    }
  } catch(error) {
    sessionState = "offline";
    app.dataset.auth = sessionState;
    console.warn("Supabase session unavailable:",error);
  }
  refreshAdminAccess().then(()=>{sendVisitorHeartbeat();render();});
  setInterval(sendVisitorHeartbeat,60000);
}

const iconSvg = (name,size=20) => {
  const paths = {
    palette:'<path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.4-3.4 1.8 1.8 0 0 1 1.3-3.1H18a3 3 0 0 0 3-3c0-4.7-4-8.5-9-8.5Z"/><circle cx="7.5" cy="10" r="1"/><circle cx="10" cy="6.8" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    'scan-face':'<path d="M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2M3 17v2a2 2 0 0 0 2 2h2m10 0h2a2 2 0 0 0 2-2v-2"/><circle cx="12" cy="11" r="3"/><path d="M8 17c1-2 7-2 8 0"/>',
    clapperboard:'<path d="M4 4h16v16H4zM4 9h16M8 4l3 5m3-5 3 5"/>',
    'folder-symlink':'<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3z"/><path d="M9 13h6m-3-3 3 3-3 3"/>',
    smartphone:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
    truck:'<path d="M3 6h11v12H3zM14 10h4l3 3v5h-7z"/><circle cx="7.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
    video:'<rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-3v10l-4-3z"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    scissors:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8.1 8.1 12 12M14 6l-3 3m-3 3 12-6"/>',
    sparkles:'<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 11 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/>',
    'user-round':'<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0m-7 7v5m-4 0h8"/>',
    music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    film:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18m10-18v18M3 8h4m-4 8h4m10-8h4m-4 8h4"/>',
    'wand-sparkles':'<path d="m15 4 5 5M4 20 17 7M6 4v4m-2-2h4m9 10v4m-2-2h4"/>',
    'pen-line':'<path d="m12 20 9-9-4-4-9 9-1 5zM14 6l4 4"/>',
    plus:'<path d="M12 5v14m-7-7h14"/>',
    send:'<path d="M12 19V5m-6 6 6-6 6 6"/>' ,
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/>',
    library:'<path d="M4 4h16v16H4zM8 4v16m4-12h4m-4 4h4"/>',
    grid:'<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    arrow:'<path d="M7 17 17 7M7 7h10v10"/>',
    back:'<path d="m15 18-6-6 6-6M9 12h12"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    coin:'<circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-1-1.7-1.5-3-1.5-1.7 0-3 1-3 2.3 0 3.4 6 1.4 6 4.5 0 1.3-1.3 2.2-3 2.2-1.3 0-2.4-.5-3.1-1.5M12 5v14"/>',
    crown:'<path d="m2 8 5 4 5-8 5 8 5-4-2 12H4z"/>',
    gift:'<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M2 12h20M12 8H7.5a2.5 2.5 0 1 1 2.5-2.5V8Zm0 0h4.5A2.5 2.5 0 1 0 14 5.5V8Z"/>',
    folder:'<path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v11H3z"/>',
    chat:'<path d="M21 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.1-4.3A8.5 8.5 0 1 1 21 11.5Z"/>',
    wand:'<path d="m15 4 5 5M4 20 17 7m-8-4v4m-2-2h4"/>',
    upload:'<path d="M12 16V4m-4 4 4-4 4 4M4 16v4h16v-4"/>',
    check:'<path d="m5 12 4 4L19 6"/>'
  };
  return '<svg class="ui-icon" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.sparkles)+'</svg>';
};
const esc = (s) => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const toolById = id => tools.find(t=>t.id===id) || {id,name:id,desc:"AI workspace",icon:"sparkles",accent:"format"};
function sidebarLink(label,icon){return `<button class="side-link ${page===label&&!activeTool?"active":""}" data-page="${label}"><span class="side-ico">${iconSvg(icon,18)}</span>${label}</button>`;}
function toolCard(t){return `<button class="tool-card ${t.accent}" data-tool="${t.id}"><div class="art"><span class="tool-icon">${iconSvg(t.icon,32)}</span></div><h3>${t.name}</h3><p>${t.desc}</p><div class="card-foot"><span>Open workspace</span><span class="card-arrow">${iconSvg("arrow",15)}</span></div></button>`;}
function renderPublicAnnouncements(){return (publicSiteConfig.announcements||[]).map(a=>'<div class="admin-upload-notice"><b>'+esc(a.title)+'</b> '+esc(a.body)+'</div>').join("");}
function renderBrandMarkup(){const name=String(publicSiteConfig.settings?.brand_name||"Magic Hour");const logo=String(publicSiteConfig.settings?.logo_url||"");const mark=/^https:\/\//i.test(logo)?'<img src="'+esc(logo)+'" alt="" class="brand-custom-logo">':'<svg class="brand-symbol" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 49V15l22 25 22-25v34" /></svg>';return '<span class="brand-mark">'+mark+'</span><span>'+esc(name)+'<small>AI STUDIO</small></span>';}
function applyPublicAppearance(){
 const color=String(publicSiteConfig.settings?.accent_color||"");
 if(/^#[0-9a-f]{6}$/i.test(color))document.documentElement.style.setProperty("--blue",color);
 const href=String(publicSiteConfig.settings?.favicon_url||"");
 if(/^https:\/\//i.test(href)){let link=document.querySelector('link[rel="icon"]');if(!link){link=document.createElement("link");link.rel="icon";document.head.appendChild(link);}link.href=href;}
 const social=String(publicSiteConfig.settings?.social_image_url||"");
 if(/^https:\/\//i.test(social))document.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]').forEach(meta=>meta.content=social);
}
function renderMaintenance(){return '<section class="empty-panel"><div class="empty-icon">'+iconSvg("settings",34)+'</div><h1 class="page-title">Magic Hour is being updated</h1><p class="page-sub">We’ll be back shortly. Thank you for your patience.</p></section>';}
function renderHome(){if(publicSiteConfig.settings?.maintenance_mode&&!isAdmin)return '<section class="empty-panel"><div class="empty-icon">'+iconSvg("settings",34)+'</div><h1 class="page-title">Magic Hour is being updated</h1><p class="page-sub">We’ll be back shortly. Thank you for your patience.</p></section>';return `${publicSiteConfig.settings?.announcement?`<div class="site-announcement-banner">${esc(publicSiteConfig.settings.announcement)}</div>`:""}
${renderCampaignPublicPlacements()}
${renderPublicAnnouncements()}
<section class="hero">
  <div><div class="eyebrow">YOUR CREATIVE SPACE, ALL IN ONE PLACE</div><h1>${esc(publicSiteConfig.settings?.homepage_headline||"What shall we create today?")}</h1><p>Design, transform and create with AI — all in one studio.</p></div>
  <div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="orb"></div><span class="spark one">${iconSvg("sparkles",21)}</span><span class="spark two">${iconSvg("sparkles",16)}</span></div>
</section>
<form class="chatbar" id="chat-form"><span aria-hidden="true">${iconSvg("sparkles",18)}</span><input id="chat-input" placeholder="Ask magic hour anything..." aria-label="Ask magic hour anything"><button class="send" aria-label="Send message">${iconSvg("send",18)}</button></form>
<section><div class="section-head"><div><h2>${iconSvg("sparkles",15)} &nbsp;Your creative tools</h2><p>Choose a workspace to get started</p></div><button class="text-btn" data-page="All tools">Explore all ${iconSvg("arrow",13)}</button></div><div class="tools-grid">${tools.filter(t=>publicSiteConfig.features?.find(f=>f.tool_id===t.id)?.enabled!==false).map(toolCard).join("")}</div></section>
<section class="more-section"><div class="section-head"><div><h2>More AI tools</h2><p>More ways to bring your ideas to life</p></div><button class="text-btn" data-page="All tools">View all ${iconSvg("arrow",13)}</button></div><div class="more-grid">${moreTools.slice(0,7).map(([n,i])=>`<button class="mini-tool" data-extra="${esc(n)}"><span>${iconSvg(i,23)}</span><b>${n}</b></button>`).join("")}</div></section>
<section class="pro-banner"><div class="crown">${iconSvg("crown",32)}</div><div class="pro-copy"><b>Upgrade to Pro</b><p>Get more credits, unlock premium tools and enjoy priority processing.</p></div><button class="pro-button" data-modal="pro">Go Pro ${iconSvg("arrow",13)}</button></section>`;}
function recentThumbs(kind,selectedId=""){
 const images=userAssets.filter(asset=>asset.mime_type?.startsWith("image/")&&asset.storage_path&&asset.signedUrl&&!dismissedRecentAssetIds.has(asset.id)).slice(0,12);
 if(!images.length)return '<p class="recent-empty">Your recently used images will appear here.</p>';
 return `<div class="recent-strip" aria-label="Recently used images">${images.map(asset=>`<div class="recent-thumb-wrap"><button type="button" class="recent-thumb ${asset.id===selectedId?"selected":""}" data-recent-${kind}="${esc(asset.id)}" aria-label="Use ${esc(asset.file_name||"recent image")}" aria-pressed="${asset.id===selectedId}"><img src="${esc(asset.signedUrl)}" alt="${esc(asset.file_name||"Recent image")}" loading="lazy">${asset.id===selectedId?'<span class="recent-check">✓</span>':""}</button><button type="button" class="recent-dismiss" data-dismiss-recent="${esc(asset.id)}" aria-label="Hide from recent images">×</button></div>`).join("")}</div>`;
}
async function pollPiapiVideo(jobId,token,attempt){
 if(token!==videoPollingToken||!jobId)return;
 if(attempt>90){workspaceNotice="Your video is taking longer than expected. You can return to AI Video and check again later.";workspaceBusy=false;render();return;}
 try{
  const {data,error}=await supabase.functions.invoke("piapi-video",{body:{action:"status",jobId}});
  if(error)throw error;
  if(data?.status==="completed"&&data.videoUrl){
   workspaceResultUrl=data.videoUrl;activeVideoJobId=null;workspaceBusy=false;workspaceNotice="Video completed and saved to your private Library.";dailyVideoCredits=Number(data.creditsRemaining??dailyVideoCredits);await loadAccountData();render();return;
  }
  if(data?.status==="failed"||data?.ok===false){
   activeVideoJobId=null;workspaceBusy=false;workspaceNotice=(data?.error||"Video generation failed.")+(data?.creditsRefunded?" Your daily credits have been returned.":"");dailyVideoCredits=Number(data?.creditsRemaining??dailyVideoCredits);await loadAccountData();render();return;
  }
  workspaceBusy=true;workspaceNotice=data?.note||"PiAPI is generating your video…";render();
  setTimeout(()=>pollPiapiVideo(jobId,token,attempt+1),8000);
 }catch(error){
  workspaceNotice="Checking generation status… "+(error?.message||"");render();
  setTimeout(()=>pollPiapiVideo(jobId,token,attempt+1),12000);
 }
}

const socialCatalog = [
 {category:"USA Numbers & Communication",items:[
  ["Google Voice","googlevoice","USA virtual number"],["TextPlus","textplus","Calling & messaging"],["NextPlus","nextdns","Calling & messaging"],["Talkatone","talkatone","Calling & messaging"],["USA WhatsApp Number 🇺🇸","whatsapp","WhatsApp number"],["UK WhatsApp Number 🇬🇧","whatsapp","WhatsApp number"],["Telegram Number","telegram","Messaging number"],["Signal Number","signal","Messaging number"],["USA Number 🇺🇸","usa","United States number"],["All Countries Numbers","globe","International numbers"]
 ]},
 {category:"Premium VPN Services",items:[
  ["ExpressVPN","expressvpn","VPN subscription"],["NordVPN","nordvpn","VPN subscription"],["Surfshark VPN","surfshark","VPN subscription"],["PIA VPN","privateinternetaccess","VPN subscription"],["IPVanish VPN","ipvanish","VPN subscription"],["HMA VPN","hide-my-ass","VPN subscription"]
 ]},
 {category:"Social Media Accounts",items:[
  ["TikTok Accounts","tiktok","Social profile"],["Twitter / X Accounts","x","Social profile"],["Dating Facebook","facebook","Facebook profile"],["USA Facebook 🇺🇸","facebook","Facebook profile"],["USA Instagram 🇺🇸","instagram","Instagram profile"],["Snapchat","snapchat","Social profile"],["Discord","discord","Community account"],["Reddit","reddit","Social profile"],["LinkedIn","linkedin","Professional profile"],["Telegram","telegram","Messaging account"],["WhatsApp","whatsapp","Messaging account"]
 ]},
 {category:"Premium Streaming",items:[
  ["Premium HD Netflix","netflix","Streaming access"],["Prime Video","primevideo","Streaming access"]
 ]},
 {category:"Email Accounts",items:[
  ["Gmail","gmail","Email account"],["Hotmail / Outlook","microsoftoutlook","Email account"],["Yahoo Mail","yahoo","Email account"],["Other Emails","maildotru","Ask for another provider"]
 ]},
 {category:"Creative & Business Services",items:[
  ["Video Editing","adobeaftereffects","Editing service"],["Voice Editing","audacity","Audio service"],["Truck Updates","truck","Information service"],["Facebook Page Creation","facebook","Page setup service"],["Working Pictures / Profiles","images","Profile media service"]
 ]}
];
const logoFallback = name => '<span class="social-logo-fallback">'+esc(name.slice(0,2).toUpperCase())+'</span>';
function socialProductCard(item,idx,catIndex){
 const [name,logo,kind]=item;
 const src=logo==="usa"||logo==="globe"||logo==="truck"||logo==="images"?"":'https://cdn.simpleicons.org/'+logo;
 return '<article class="social-product"><div class="social-product-top"><div class="social-brand-logo">'+(src?'<img src="'+src+'" alt="'+esc(name)+' logo" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'social-logo-fallback\',textContent:'+JSON.stringify(name.slice(0,2).toUpperCase())+'}))">':logoFallback(name))+'</div><span class="social-stock">Available now</span></div><h3>'+esc(name)+'</h3><p class="social-kind">'+esc(kind)+'</p><div class="social-details"><div><span>Account / service age</span><b>Confirm available age</b></div><div><span>Username</span><b>Provided where applicable</b></div><div><span>Password</span><b>Secure handover after order</b></div><div><span>Two-factor (2FA)</span><b>Confirm before booking</b></div></div><label class="social-select"><input type="checkbox" data-social-item="'+catIndex+'-'+idx+'" value="'+esc(name)+'"><span>Add to order</span></label></article>';
}
function renderSocialRoom(){
 const groups=socialCatalog.map((group,ci)=>'<section class="social-category" id="social-category-'+ci+'"><div class="social-category-head"><div><span class="social-category-kicker">CATEGORY '+String(ci+1).padStart(2,"0")+'</span><h2>'+esc(group.category)+'</h2><p>'+group.items.length+' services available</p></div></div><div class="social-product-grid">'+group.items.map((item,i)=>socialProductCard(item,i,ci)).join("")+'</div><button class="social-book-btn" data-social-book="'+ci+'">Book from '+esc(group.category)+' <span>↗</span></button></section>').join("");
 return '<div class="social-room"><div class="social-room-hero"><div><span class="social-category-kicker">MAGIC HOUR MARKETPLACE</span><h1>All Social Media <span>Sales Room</span></h1><p>Accounts, numbers, subscriptions and digital services in one place.</p><div class="social-trust-row"><span>✓ Fast service</span><span>✓ Secure handover</span><span>✓ WhatsApp booking</span></div></div><div class="social-room-mark">M<span>+</span></div></div><div class="social-search-wrap"><span>⌕</span><input id="social-search" type="search" placeholder="Search services, accounts or platforms…" aria-label="Search services"></div><div class="social-category-nav">'+socialCatalog.map((g,i)=>'<button data-social-jump="'+i+'">'+esc(g.category)+'</button>').join("")+'</div><div class="social-stock-note"><b>All services listed as available now.</b> Exact account age and 2FA arrangements are confirmed against current stock before payment. Never send passwords or verification codes in this public catalogue.</div>'+groups+'<div class="social-help-card"><h3>Need another service?</h3><p>Ask us about other countries, platforms or account types.</p><a href="https://wa.me/2349041259863?text='+encodeURIComponent("Hello Magic Hour, I would like to ask about another service.")+'" target="_blank" rel="noopener">Ask on WhatsApp ↗</a></div></div>';
}

const shipmentPlaces={"Nigeria":["Lagos","Abuja","Kano","Port Harcourt","Enugu"],"United Kingdom":["London","Manchester","Liverpool","Birmingham","Glasgow"],"United States":["New York","Los Angeles","Chicago","Atlanta","Miami","Dallas"],"United Arab Emirates":["Dubai","Abu Dhabi","Sharjah"],"Germany":["Frankfurt","Berlin","Munich","Hamburg"],"France":["Paris","Lyon","Marseille"],"Netherlands":["Amsterdam","Rotterdam"],"Canada":["Toronto","Vancouver","Montreal"],"South Africa":["Johannesburg","Cape Town","Durban"],"Kenya":["Nairobi","Mombasa"],"Ghana":["Accra","Kumasi"],"Turkey":["Istanbul","Ankara"],"India":["Delhi","Mumbai","Bengaluru"],"China":["Beijing","Shanghai","Guangzhou"],"Singapore":["Singapore"]};
const shipmentOperators={"Nigeria":["Air Peace","United Nigeria Airlines","Arik Air"],"United Kingdom":["British Airways","Virgin Atlantic","easyJet"],"United States":["American Airlines","Delta Air Lines","United Airlines","FedEx Express","UPS Airlines"],"United Arab Emirates":["Emirates","Etihad Airways","flydubai"],"Germany":["Lufthansa","Eurowings"],"France":["Air France"],"Netherlands":["KLM"],"Canada":["Air Canada","WestJet"],"South Africa":["South African Airways","FlySafair"],"Kenya":["Kenya Airways"],"Ghana":["Africa World Airlines"],"Turkey":["Turkish Airlines"],"India":["Air India","IndiGo"],"China":["Air China","China Southern"],"Singapore":["Singapore Airlines"]};
function shipmentCountryOptionsFor(selected=""){return Object.keys(shipmentPlaces).map(c=>`<option value="${esc(c)}" ${c===selected?"selected":""}>${esc(c)}</option>`).join("");}const shipmentCountryOptions=shipmentCountryOptionsFor();
function shipmentCityOptions(country,selected=""){const cities=shipmentPlaces[country]||[];const values=[...cities];if(selected&&!values.includes(selected))values.unshift(selected);return values.map(city=>'<option value="'+esc(city)+'" '+(city===selected?"selected":"")+'>'+esc(city)+'</option>').join("")||'<option value="">Choose a country first</option>';}
function shipmentOperatorOptions(country,selected=""){const names=[...(shipmentOperators[country]||[])];if(selected&&!names.includes(selected))names.unshift(selected);if(!names.length)names.push("Other operator");return names.map(name=>'<option value="'+esc(name)+'" '+(name===selected?"selected":"")+'>'+esc(name)+'</option>').join("");}
function shipmentBarcode(code){let seed=0;for(const ch of String(code))seed=(seed*31+ch.charCodeAt(0))>>>0;let bars='<rect x="0" y="0" width="2" height="54" fill="#111"/><rect x="5" y="0" width="1" height="54" fill="#111"/>';for(let i=0;i<92;i++){seed=(seed*1664525+1013904223)>>>0;const w=1+(seed%3);if(seed&4)bars+='<rect x="'+(8+i*2.1)+'" y="0" width="'+w+'" height="54" fill="#111"/>';}return '<svg class="shipment-barcode" viewBox="0 0 205 66" role="img" aria-label="Tracking barcode for '+esc(code)+'">'+bars+'<text x="102" y="64" text-anchor="middle">'+esc(code)+'</text></svg>';}
function renderShipmentOwnerControls(){if(!shipmentCreated?.id)return "";const rows=shipmentOwnerMessages.map(m=>'<div class="shipment-chat-message '+(m.sender_role==="sender"?"mine":"")+'"><b>'+esc(m.sender_name)+'</b><p>'+esc(m.message)+'</p><small>'+new Date(m.created_at).toLocaleString()+'</small></div>').join("");return '<section class="workspace shipment-owner-controls"><h2>Manage this shipment</h2><p class="page-sub">Change the route, publish road notices or request documents. Recipients see updates on their tracking page.</p><form id="shipment-update-form" class="shipment-fields"><label>Origin country<select name="origin_country" data-shipment-country="origin" required>'+shipmentCountryOptionsFor(shipmentCreated.origin_country||"Nigeria")+'</select></label><label>Origin city<select name="origin_city" data-shipment-city="origin" required>'+shipmentCityOptions(shipmentCreated.origin_country||"Nigeria",shipmentCreated.origin_city||"")+'</select></label><label>Destination country<select name="destination_country" data-shipment-country="destination" required>'+shipmentCountryOptionsFor(shipmentCreated.destination_country||"United Kingdom")+'</select></label><label>Destination city<select name="destination_city" data-shipment-city="destination" required>'+shipmentCityOptions(shipmentCreated.destination_country||"United Kingdom",shipmentCreated.destination_city||"")+'</select></label><label>Airline / operator<select name="operator_name" data-shipment-operator required>'+shipmentOperatorOptions(shipmentCreated.origin_country||"Nigeria",shipmentCreated.operator_name||"")+'</select></label><label>Current location<input name="current_location" value="'+esc(shipmentCreated.current_location||"")+'" placeholder="Airport, city or checkpoint"></label><label>Current latitude<input name="current_lat" type="number" step="any" value="'+(shipmentCreated.current_lat??"")+'" placeholder="Optional map latitude"></label><label>Current longitude<input name="current_lng" type="number" step="any" value="'+(shipmentCreated.current_lng??"")+'" placeholder="Optional map longitude"></label><label>Public tracking status<input name="public_status_label" maxlength="80" value="'+esc(shipmentCreated.public_status_label||"")+'" placeholder="e.g. Arrived at airport"></label><label>Delivery estimate<input name="delivery_estimate" value="'+esc(shipmentCreated.delivery_estimate||"")+'" placeholder="e.g. Today before 6 PM"></label><label>New departure time<input name="departure" type="datetime-local" required value="'+(shipmentCreated.departure_at?new Date(new Date(shipmentCreated.departure_at).getTime()-new Date(shipmentCreated.departure_at).getTimezoneOffset()*60000).toISOString().slice(0,16):"")+'"></label><label>Expected arrival<input name="arrival" type="datetime-local" required value="'+(shipmentCreated.arrival_at?new Date(new Date(shipmentCreated.arrival_at).getTime()-new Date(shipmentCreated.arrival_at).getTimezoneOffset()*60000).toISOString().slice(0,16):"")+'"></label><label>Update type<select name="event_type"><option value="checkpoint">Route checkpoint</option><option value="stop">Vehicle stopped</option><option value="blockage">Route blocked — pause shipment</option><option value="clear_blockage">Obstruction cleared — resume shipment</option><option value="resume">Journey resumed</option><option value="delay">Delay / road issue</option><option value="document_request">Document request</option><option value="notice">Shipment notice</option></select></label><label>Update title<input name="title" required maxlength="120" placeholder="e.g. Customs documents required"></label><label>Stop / blockage location<input name="stop_location" maxlength="160" placeholder="Optional: e.g. Abuja airport or Kaduna highway"></label><label class="shipment-wide">Message / details<textarea name="details" rows="2" maxlength="1000" placeholder="Explain the stop, blockage, checkpoint or documents needed"></textarea></label><button class="primary-btn" type="submit">Publish shipment update</button></form><div class="shipment-chat-heading"><h3>Messages with recipient</h3><button class="secondary-btn" data-shipment-refresh-chat>Refresh</button></div><div class="shipment-chat-log">'+(rows||'<p class="recent-empty">No messages yet.</p>')+'</div><form id="shipment-sender-message" class="shipment-chat-form"><input name="message" maxlength="1000" required placeholder="Message the recipient…"><button class="primary-btn" type="submit">Send</button></form></section>';}
async function loadShipmentOwnerMessages(){if(!shipmentCreated?.id)return;const {data,error}=await supabase.from("ms_shipment_messages").select("id,sender_role,sender_name,message,created_at").eq("shipment_id",shipmentCreated.id).order("created_at",{ascending:true}).limit(100);if(!error)shipmentOwnerMessages=data||[];}
function renderShipmentRoom(){
 const carriers=["UPS","FedEx","Knight-Swift","DHL","USPS","Aramex","GIG Logistics","Local courier","Other carrier"];
 const carrierOptions=carriers.map(x=>'<option value="'+x+'">'+x+'</option>').join("");
 const shipmentList=userShipments.map(x=>'<button class="account-panel shipment-history-row" data-shipment-open="'+x.id+'"><b>'+esc(x.tracking_code)+' · '+esc(x.carrier)+'</b><p>'+esc(x.origin)+' → '+esc(x.destination)+' · '+esc(x.status)+'</p><small>'+new Date(x.created_at).toLocaleDateString()+'</small></button>').join("");
 return '<div class="section-head"><div><h1 class="page-title">Shipment Journey</h1><p class="page-sub">Create a private shipment page with an animated route preview and scheduled journey.</p></div><button class="back-btn" data-action="back">← Back</button></div>'+
 '<div class="shipment-intro"><div class="shipment-intro-icon">✈</div><div><b>Your shipment, beautifully presented</b><p>Choose a carrier, add your items, set the journey schedule and share a private tracking page. This is a privately operated scheduled journey preview, not the carrier\'s official tracking system.</p></div></div>'+
 (shipmentNotice?'<p class="notice">'+esc(shipmentNotice)+'</p>':'')+(shipmentList?'<section class="shipment-history"><h2>Your shipments</h2>'+shipmentList+'</section>':'')+
 (shipmentCreated?'<div class="shipment-created"><span class="shipment-kicker">SHIPMENT CREATED</span><h2>'+esc(shipmentCreated.tracking_code)+'</h2><p>Tracking link</p><div class="shipment-share-url"><code>'+esc(shipmentCreated.url)+'</code><button class="secondary-btn" data-shipment-copy="url">Copy</button></div><p>Tracking password</p><div class="shipment-share-url"><code>'+esc(shipmentCreated.password||"Not displayed — generate a new one if needed")+'</code>'+(shipmentCreated.password?'<button class="secondary-btn" data-shipment-copy="password">Copy</button>':'')+'</div><button class="secondary-btn" data-shipment-new-password>Generate new tracking password</button><p class="shipment-warning">Share the password privately with your recipient. It is never included in the tracking URL.</p></div>'+renderShipmentOwnerControls():'')+
 '<form id="shipment-create-form" class="workspace shipment-form"><div class="workspace-head"><div class="tool-icon">'+iconSvg("truck",27)+'</div><div><h2>Build a shipment</h2><p>Enter the shipment details and schedule</p></div></div><div class="shipment-fields">'+
 '<label>Shipping service<select name="carrier" required>'+carrierOptions+'</select></label><label>Transport type<select name="transport" required><option value="air">Air freight · Aeroplane</option><option value="road">Road freight · Truck</option><option value="sea">Sea freight · Ship</option></select></label>'+
 '<label>Sender name<input name="sender" maxlength="100" required placeholder="Sender name"></label><label>Recipient name<input name="recipient" maxlength="100" required placeholder="Recipient name"></label>'+
 '<label>Origin country<select name="origin_country" data-shipment-country="origin" required>'+shipmentCountryOptionsFor("Nigeria")+'</select></label><label>Origin city<select name="origin_city" data-shipment-city="origin" required>'+shipmentCityOptions("Nigeria")+'</select></label><label>Destination country<select name="destination_country" data-shipment-country="destination" required>'+shipmentCountryOptionsFor("United Kingdom")+'</select></label><label>Destination city<select name="destination_city" data-shipment-city="destination" required>'+shipmentCityOptions("United Kingdom")+'</select></label><label class="shipment-wide">Airline / carrier operator<select name="operator_name" data-shipment-operator>'+shipmentOperatorOptions("Nigeria")+'</select></label>'+
 '<label class="shipment-wide">Items being sent<textarea name="items" rows="3" maxlength="1500" required placeholder="List the item names and short descriptions"></textarea></label>'+
 '<label>Journey starts<input name="departure" type="datetime-local" required></label><label>Expected arrival<input name="arrival" type="datetime-local" required></label></div>'+
 '<div class="shipment-upload-grid"><label class="shipment-upload">📷 <b>Item photos</b><span>Upload up to 8 photos</span><input id="shipment-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><label class="shipment-upload">🎥 <b>Short shipment video</b><span>Upload one video · up to 30 MB</span><input id="shipment-video" type="file" accept="video/mp4,video/webm,video/quicktime"></label></div><div id="shipment-file-status" class="shipment-file-status">No media selected yet.</div>'+
 '<button class="primary-btn" type="submit" '+(shipmentBusy?'disabled':'')+'>'+(shipmentBusy?'Creating shipment…':'Create tracking link →')+'</button></form>';
}
function renderTool(){const featureConfig=publicSiteConfig.features?.find(x=>x.tool_id===activeTool);if(!isAdmin&&featureConfig?.enabled===false)return '<section class="empty-panel"><h1 class="page-title">This tool is temporarily unavailable</h1><p class="page-sub">Please check back later.</p><button class="primary-btn" data-action="back">Back to tools</button></section>';if(!isAdmin&&featureConfig?.access_tier==="restricted")return '<section class="empty-panel"><h1 class="page-title">This workspace is restricted</h1><p class="page-sub">This tool is not currently available to your account.</p><button class="primary-btn" data-action="back">Back to tools</button></section>';if(!isAdmin&&featureConfig?.access_tier==="pro"&&!membershipInfo)return '<section class="empty-panel"><h1 class="page-title">Magic Hour Pro required</h1><p class="page-sub">Upgrade your membership to access this creative workspace.</p><button class="primary-btn" data-modal="pro">Explore Pro</button><button class="secondary-btn" data-action="back">Back to tools</button></section>';if(activeTool==="shipment-room")return renderShipmentRoom();if(activeTool==="social")return renderSocialRoom();const t=toolById(activeTool);if(activeTool==="ai-video"||activeTool==="image-to-video"){const heading=activeTool==="image-to-video"?"Image to Video":"AI Video Animate";const creditCost=videoDurationSeconds*10;return `
<div class="section-head"><div><h1 class="page-title">${heading}</h1><p class="page-sub">Turn a still image into a moving video with PiAPI Kling.</p></div><button class="back-btn" data-action="back">← Back</button></div>
<div class="workspace"><div class="workspace-head"><div class="tool-icon">${iconSvg("video",27)}</div><div><h2>PiAPI video studio</h2><p>Image-to-video generation · Private Library storage</p></div></div>
<div class="video-credit-strip"><div><small>DAILY VIDEO CREDITS</small><strong>${dailyVideoCredits} <span>/ 100</span></strong></div><div><small>THIS GENERATION</small><strong>${creditCost} credits</strong></div></div>
<div class="notice">You receive 100 video credits each day. Free access is limited to 10 seconds, at 10 credits per second. Credits are charged securely and returned if PiAPI rejects or fails the task. Longer Pro durations will unlock once the Pro payment and subscription checks are connected.</div>
<div class="upload-zone video-upload-zone"><div class="video-source-preview">${videoPreviewUrl?`<img src="${esc(videoPreviewUrl)}" alt="Selected source image">`:`<span>${iconSvg("image",32)}</span>`}</div><h3>Choose your starting image</h3><p>${selectedVideoFile?esc(selectedVideoFile.name):"Upload a JPG, PNG or WebP image to animate."}</p><label for="video-image-upload">Browse images</label><input id="video-image-upload" type="file" accept="image/jpeg,image/png,image/webp" hidden></div>
<label class="video-field-label" for="video-prompt">Describe the movement</label><textarea id="video-prompt" class="video-prompt" maxlength="1200" placeholder="Example: The person smiles naturally, turns slightly toward the camera, and their hair moves gently in the breeze.">${esc(videoPromptText)}</textarea>
<div class="video-options"><label><span>Video duration</span><select id="video-duration"><option value="5" ${videoDurationSeconds===5?"selected":""}>5 seconds · 50 credits</option><option value="10" ${videoDurationSeconds===10?"selected":""}>10 seconds · 100 credits</option></select></label><label><span>Aspect ratio</span><select id="video-ratio"><option value="16:9" ${videoAspectRatio==="16:9"?"selected":""}>Landscape · 16:9</option><option value="9:16" ${videoAspectRatio==="9:16"?"selected":""}>Portrait · 9:16</option><option value="1:1" ${videoAspectRatio==="1:1"?"selected":""}>Square · 1:1</option></select></label></div>
<div id="file-status" class="page-sub">${esc(workspaceNotice||"Upload an image and describe how it should move.")}</div>
<button class="primary-btn" data-action="run-ai-video" ${workspaceBusy||!selectedVideoFile||dailyVideoCredits<creditCost?"disabled":""}>${workspaceBusy?"Creating your video…":"Generate video · "+creditCost+" credits"}</button>
${dailyVideoCredits<creditCost?'<p class="page-sub">Not enough daily credits for this duration. Your allowance refreshes daily.</p>':""}
${workspaceResultUrl?`<div class="swap-result"><h3>Your generated video</h3><video class="generated-video" src="${esc(workspaceResultUrl)}" controls playsinline></video><div class="result-actions"><a class="primary-btn" href="${esc(workspaceResultUrl)}" download="muskysocials-ai-video.mp4">↓ Download video</a><button class="secondary-btn" data-page="Library">Open Library</button></div></div>`:""}
</div>`;}
if(activeTool==="background-remover")return `
<div class="section-head"><div><h1 class="page-title">Background Remover</h1><p class="page-sub">Remove image backgrounds in seconds and save the transparent PNG to your Library.</p></div><button class="back-btn" data-action="back">← Back</button></div>
<div class="workspace"><div class="workspace-head"><div class="tool-icon">${iconSvg("scissors",27)}</div><div><h2>AI Background Removal</h2><p>Powered by remove.bg</p></div></div>
<div class="notice">Upload a JPG, PNG or WebP image up to 12 MB. Your original and transparent result are stored in your private Supabase Library.</div>
<div class="upload-zone"><div style="font-size:34px">${iconSvg("upload",30)}</div><h3>Choose an image</h3><p>${selectedAssetFile?esc(selectedAssetFile.name):"Select a photo to remove its background."}</p><label for="bg-upload">Browse images</label><input id="bg-upload" type="file" accept="image/jpeg,image/png,image/webp"></div>
<div id="file-status" class="page-sub">${esc(workspaceNotice||"Choose an image to get started.")}</div>
<button class="primary-btn" data-action="run-background" ${workspaceBusy||!selectedAssetFile?"disabled":""}>${workspaceBusy?"Removing background…":"Remove background"}</button>
${workspaceResultUrl?`<div class="swap-result"><h3>Transparent result</h3><img class="result-image transparent-preview" src="${esc(workspaceResultUrl)}" alt="Image with background removed"><div class="result-actions"><a class="primary-btn" href="${esc(workspaceResultUrl)}" download="background-removed.png">↓ Download PNG</a></div></div>`:""}
</div>`;
if(activeTool==="headswap")return `
<div class="section-head"><div><h1 class="page-title">Image HeadSwap</h1><p class="page-sub">Swap a face into another photo with the BFS AI engine.</p></div><button class="back-btn" data-action="back">← Back</button></div>
<div class="workspace"><div class="workspace-head"><div class="tool-icon">${iconSvg("scan-face",27)}</div><div><h2>AI Face Swap</h2><p>Upload a reference face and the photo you want to edit.</p></div></div>
<div class="notice">Your images and generated result are stored in your private Supabase library. Use photos you own or have permission to edit.</div>
<div class="swap-upload-grid">
<div class="upload-zone swap-upload-card"><div class="swap-preview">${referencePreviewUrl?`<img src="${esc(referencePreviewUrl)}" alt="Selected face preview">`:`<span>${iconSvg("user-round",27)}</span>`}</div><h3>1. Face Image</h3><p>Choose a recent face or upload a new one</p><label class="upload-new-button" for="reference-face-upload">${iconSvg("upload",14)} Upload new face</label><input id="reference-face-upload" type="file" accept="image/jpeg,image/png,image/webp" hidden><div class="recent-heading">Recently used</div>${recentThumbs("face",selectedReferenceAssetId)}<div class="swap-file-name">${selectedReferenceFace?esc(selectedReferenceFace.name):selectedReferenceAssetId?"Recent image selected":"Choose a recent image or upload new"}</div></div>
<div class="upload-zone swap-upload-card"><div class="swap-preview">${targetPreviewUrl?`<img src="${esc(targetPreviewUrl)}" alt="Selected target preview">`:`<span>${iconSvg("image",27)}</span>`}</div><h3>2. Target Image</h3><p>Choose a recent image or upload a new one</p><label class="upload-new-button" for="target-image-upload">${iconSvg("upload",14)} Upload new image</label><input id="target-image-upload" type="file" accept="image/jpeg,image/png,image/webp" hidden><div class="recent-heading">Recently used</div>${recentThumbs("target",selectedTargetAssetId)}<div class="swap-file-name">${selectedTargetImage?esc(selectedTargetImage.name):selectedTargetAssetId?"Recent image selected":"Choose a recent image or upload new"}</div></div>
</div>
<div id="file-status" class="page-sub">${esc(workspaceNotice||"Select both images to begin.")}</div>
<button class="primary-btn" data-action="run-headswap" ${workspaceBusy?"disabled":""}>${workspaceBusy?"Generating face swap…":"Generate face swap"}</button>
${workspaceResultUrl?`<div class="swap-result"><h3>Your generated image</h3><img class="result-image" src="${esc(workspaceResultUrl)}" alt="Generated face swap result" data-preview="${esc(workspaceResultUrl)}"><div class="result-actions"><button class="primary-btn" data-action="download-result">↓ Download</button><button class="secondary-btn" data-action="share-result">↗ Share</button></div></div>`:""}
</div>`;
return `
<div class="section-head"><div><h1 class="page-title">${t.name}</h1><p class="page-sub">${t.desc}</p></div><button class="back-btn" data-action="back">← Back</button></div>
<div class="workspace"><div class="workspace-head"><div class="tool-icon">${iconSvg(t.icon,27)}</div><div><h2>${t.name}</h2><p>Your dedicated magic hour workspace</p></div></div>
<div class="notice">Your account, project records and private file storage are connected. AI generation still needs its provider service to be enabled.</div>
<div class="upload-zone"><div style="font-size:34px">${iconSvg("upload",30)}</div><h3>Upload your files</h3><p>Choose a file from your device to prepare your project.</p><label for="asset-upload">Browse files</label><input id="asset-upload" type="file" accept="image/*,video/*,.pdf,.doc,.docx,.png,.jpg,.jpeg,.mp4,.mov"></div>
<div id="file-status" class="page-sub">${workspaceNotice?esc(workspaceNotice):(selectedFile?esc(selectedFile):"No file selected yet.")}</div>
<button class="primary-btn" data-action="prepare" ${workspaceBusy?"disabled":""}>${workspaceBusy?"Saving project…":"Save project and upload file"}</button>
</div>`;}
function renderChat(){return `<h1 class="page-title">New chat</h1><p class="page-sub">A creative assistant for your ideas.</p><div class="workspace"><div class="chat-log">${messages.length?messages.map(m=>`<div class="bubble ${m.role}">${esc(m.text)}</div>`).join(""):'<div class="bubble">Hi! I’m your magic hour assistant. Tell me what you want to make, or choose one of the creative tools on Home.</div>'}</div><form class="chatbar" id="chat-form"><span>${iconSvg("sparkles",18)}</span><input id="chat-input" placeholder="Message magic hour..." aria-label="Message magic hour"><button class="send" aria-label="Send message">${iconSvg("send",18)}</button></form><div class="notice">The chat interface is ready. Connect your preferred AI chat API to enable live AI responses.</div></div>`;}
async function developerApiRequest(route, method="GET", body=null){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session?.access_token)throw new Error("Your sign-in session has expired. Please sign in again.");
 const response=await fetch(SUPABASE_URL+"/functions/v1/developer-api"+route,{
  method,
  headers:{"Authorization":"Bearer "+session.access_token,"apikey":SUPABASE_ANON_KEY,"Content-Type":"application/json"},
  ...(body?{body:JSON.stringify(body)}:{})
 });
 const data=await response.json().catch(()=>({}));
 if(!response.ok||data?.ok===false)throw new Error(data?.error||("Developer API request failed ("+response.status+")."));
 return data;
}
async function loadDeveloperDashboard(force=false){
 if(developerLoading||(!force&&developerLoaded))return;
 developerLoading=true;developerError="";render();
 try{
  const [keys,usage]=await Promise.all([developerApiRequest("/keys"),developerApiRequest("/usage")]);
  developerKeys=Array.isArray(keys.keys)?keys.keys:[];
  developerUsage=usage;developerLoaded=true;
 }catch(error){developerError=error?.message||String(error);}
 finally{developerLoading=false;render();}
}
function renderDeveloperPanel(){
 const keys=developerKeys.length?developerKeys.map(k=>'<div class="account-panel api-key-row"><div><b>'+esc(k.name||"API key")+'</b><p>'+esc(k.key_prefix||"ms_live_…")+' · Created '+new Date(k.created_at).toLocaleDateString()+'</p><small>'+(k.revoked_at?'Revoked':'Last used: '+(k.last_used_at?new Date(k.last_used_at).toLocaleString():'Never'))+'</small></div>'+(k.revoked_at?'':'<button class="secondary-btn" data-api-revoke="'+esc(k.id)+'">Revoke</button>')+'</div>').join(""):'<div class="notice">No API keys yet. Create your first key to let another website connect to Magic Hour.</div>';
 const usage=developerUsage||{};
 return '<section class="developer-panel"><div class="developer-head"><div><span class="developer-kicker">FOR DEVELOPERS</span><h2>Magic Hour API</h2><p>Connect other websites and apps to your Magic Hour account.</p></div><button class="secondary-btn" data-api-refresh '+(developerLoading?'disabled':'')+'>'+(developerLoading?'Loading…':'Refresh')+'</button></div>'+
 (developerError?'<p class="notice">'+esc(developerError)+'</p>':'')+
 (developerNewKey?'<div class="api-new-key"><b>Your new API key — copy it now</b><p>This secret is shown only once. Store it somewhere safe.</p><code>'+esc(developerNewKey)+'</code><button class="primary-btn" data-api-copy>Copy API key</button></div>':'')+
 '<div class="api-metrics"><div><small>REQUESTS · 30 DAYS</small><b>'+Number(usage.totalRequests||0).toLocaleString()+'</b></div><div><small>SUCCESSFUL</small><b>'+Number(usage.successfulRequests||0).toLocaleString()+'</b></div><div><small>FAILED</small><b>'+Number(usage.failedRequests||0).toLocaleString()+'</b></div></div>'+
 '<div class="api-create-row"><input id="api-key-name" maxlength="60" placeholder="Key name (e.g. My website)" aria-label="API key name"><button class="primary-btn" data-api-create '+(developerLoading?'disabled':'')+'>Create API key</button></div>'+
 '<h3>API keys</h3><div class="api-key-list">'+keys+'</div>'+
 '<h3>API base URL</h3><div class="api-base-url"><code>'+SUPABASE_URL+'/functions/v1/developer-api</code><button class="secondary-btn" data-api-copy-base>Copy</button></div>'+
 '<h3>Available read endpoints</h3><div class="api-endpoints"><p><b>GET /v1/tools</b> — list available AI tools</p><p><b>GET /v1/account</b> — wallet balance and active membership</p><p><b>GET /v1/usage</b> — API usage for this key</p></div>'+
 '<p class="api-note">Face Swap is live at POST /v1/face-swap and costs 60 coins per successful request. Send multipart fields reference and target plus a unique Idempotency-Key header. Other generation tools are still being connected.</p></section>';
}

async function refreshAdminAccess(){
 if(!currentUser){isAdmin=false;return false;}
 try{const {data,error}=await supabase.from("admin_users").select("role").eq("user_id",currentUser.id).maybeSingle();isAdmin=!error&&!!data&&["admin","owner","super_admin"].includes(data.role)&&(currentUser.email||"").toLowerCase()==="ugohjeremiah16@gmail.com";return isAdmin;}
 catch{isAdmin=false;return false;}
}
function visitorSessionId(){
 const key="mh_admin_visitor_id_v1";let id="";
 try{id=localStorage.getItem(key)||"";if(!id){id=crypto.randomUUID();localStorage.setItem(key,id);}}catch{id=crypto.randomUUID();}
 return id;
}
let visitorVisitStarted=false;
async function sendVisitorHeartbeat(){
 const startsVisit=!visitorVisitStarted;
 if(startsVisit)visitorVisitStarted=true;
 try{
  const {data,error}=await supabase.functions.invoke("admin-console",{body:{action:"heartbeat",visitor_id:visitorSessionId(),path:location.pathname+location.search,visit_start:startsVisit}});
  if(error||data?.error)throw error||new Error(data.error);
 }catch(error){if(startsVisit)visitorVisitStarted=false;console.warn("Visitor heartbeat:",error?.message||error);}
}
async function adminConsoleRequest(action,payload={}){
 const {data,error}=await supabase.functions.invoke("admin-console",{body:{action,...payload}});
 if(error)throw error;if(data?.error)throw new Error(data.error);return data;
}
function sendSiteTelemetry(eventType,message="",stack="",durationMs=0){
 try{
  const visitorId=visitorSessionId();
  const scrub=value=>String(value||"").replace(/([?&][^=\s]+)=([^&\s]+)/g,"$1=[redacted]");
  supabase.functions.invoke("admin-console",{body:{action:"telemetry",visitor_id:visitorId,event_type:eventType,message:scrub(message).slice(0,1000),stack:scrub(stack).slice(0,4000),path:location.pathname,duration_ms:durationMs}})
   .then(({error,data})=>{if(error||data?.error)console.warn("Site telemetry:",error?.message||data?.error||"unavailable");})
   .catch(error=>console.warn("Site telemetry:",error?.message||error));
 }catch(error){console.warn("Site telemetry:",error?.message||error);}
}
window.addEventListener("error",event=>{
 if(event.message)sendSiteTelemetry("javascript_error",event.message,event.error?.stack||"");
});
window.addEventListener("unhandledrejection",event=>{
 const reason=event.reason;sendSiteTelemetry("unhandled_rejection",reason?.message||String(reason||"Unhandled promise rejection"),reason?.stack||"");
});
window.addEventListener("load",()=>{
 const nav=performance.getEntriesByType("navigation")[0];
 if(nav)sendSiteTelemetry("page_load","Page load completed","",Math.round(nav.loadEventEnd||nav.duration||0));
},{once:true});

async function campaignServiceRequest(action,payload={}){const {data,error}=await supabase.functions.invoke("campaign-service",{body:{action,...payload}});if(error)throw error;if(data?.error)throw new Error(data.error);return data;}
async function loadAdminCampaigns(){if(!isAdmin||adminCampaignLoading)return;adminCampaignLoading=true;adminCampaignNotice="";render();try{const data=await campaignServiceRequest("list_admin");adminCampaigns=data.campaigns||[];}catch(error){adminCampaignNotice="Campaign service not deployed or unavailable: "+(error?.message||String(error));}finally{adminCampaignLoading=false;render();}}
async function loadPublicCampaigns(){try{const data=await campaignServiceRequest("list_public");publicCampaigns=data.campaigns||[];publicCampaignsLoaded=true;render();}catch(error){publicCampaignsLoaded=true;console.warn("Campaign delivery unavailable:",error?.message||error);}}
async function loadAdminDashboard(silent=false){
 if(!isAdmin||adminDashboardLoading)return;
 adminDashboardLoading=true;adminDashboardError="";if(!silent)render();
 try{adminDashboardData=await adminConsoleRequest("dashboard");}
 catch(error){adminDashboardError=error?.message||String(error);}
 finally{adminDashboardLoading=false;render();}
}
function renderAdminOverview(){
 if(!isAdmin)return '<section class="admin-wrap"><h1>Admin access required</h1><p>This account is not registered as an administrator.</p></section>';
 if(!adminDashboardData&&!adminDashboardLoading){queueMicrotask(()=>loadAdminDashboard());}
 if(!adminDashboardData)return '<section class="admin-wrap"><div class="admin-head"><div><div class="eyebrow">MAGIC HOUR CONTROL ROOM</div><h1>Admin dashboard</h1><p>Loading live app metrics…</p></div></div><div class="admin-loading">Checking users, guests, database and services…</div></section>';
 const d=adminDashboardData,c=d.counts||{};
 const health=(d.health||[]).map(h=>'<div class="admin-health-card"><span class="admin-health-dot '+esc(h.status)+'"></span><div><b>'+esc(h.name)+'</b><small>'+esc(h.detail)+'</small></div><strong>'+esc(h.status.toUpperCase())+'</strong></div>').join("");
 const users=(d.users||[]).map(u=>'<tr><td><b>'+esc(u.email||"No email")+'</b><small>'+esc(u.id)+'</small></td><td>'+new Date(u.created_at).toLocaleDateString()+'</td><td>'+(u.last_sign_in_at?new Date(u.last_sign_in_at).toLocaleString():"Never")+'</td><td>'+Number(u.wallet_balance||0).toLocaleString()+'</td><td>'+esc(u.membership?.plan_name||"Free")+'</td></tr>').join("");
 const issues=(d.issues||[]).map(x=>'<article class="admin-issue"><div><span class="admin-pill '+esc(x.severity)+'">'+esc(x.severity)+'</span> <span class="admin-pill">'+esc(x.status)+'</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.details||"No details provided")+'</p><small>'+new Date(x.created_at).toLocaleString()+'</small></div><div class="admin-issue-actions">'+(x.status!=="investigating"?'<button class="secondary-btn" data-admin-issue-status="'+x.id+'" data-status="investigating">Investigate</button>':"")+(x.status!=="resolved"?'<button class="primary-btn" data-admin-issue-status="'+x.id+'" data-status="resolved">Mark fixed</button>':'<span class="admin-resolved">Resolved</span>')+'</div></article>').join("")||'<p class="admin-muted">No issues recorded yet. Add an issue when something needs attention.</p>';
 const visitors=(d.recent_visitors||[]).map(v=>{const u=(d.users||[]).find(x=>x.id===v.user_id);return '<tr><td>'+(u?esc(u.email):'<span class="admin-guest">Guest visitor</span>')+'</td><td>'+esc(v.last_path||"/")+'</td><td>'+new Date(v.last_seen_at).toLocaleString()+'</td></tr>';}).join("");
 return '<section class="admin-wrap"><div class="admin-head"><div><div class="eyebrow">MAGIC HOUR CONTROL ROOM</div><h1>Admin dashboard</h1><p>Signed in as '+esc(currentUser?.email||"")+' · Updated '+new Date(d.generated_at).toLocaleTimeString()+'</p></div><button class="primary-btn" data-admin-refresh '+(adminDashboardLoading?'disabled':'')+'>↻ Refresh health</button></div>'+
 (adminDashboardError?'<div class="admin-alert">'+esc(adminDashboardError)+'</div>':"")+
 '<div class="admin-section-title"><h2>App overview</h2><span>Live database snapshot</span></div><div class="admin-stat-grid">'+
 [['Registered users',c.registered_users,'accounts'],['Active visitors',c.active_visitors_5m,'last 5 minutes'],['Guest visitors',c.active_guests_24h,'last 24 hours'],['Guest sessions',c.guest_sessions_total,'recorded sessions'],['Projects',c.projects,'saved projects'],['Assets',c.assets,'uploaded files'],['Video jobs',c.video_jobs,'all jobs'],['Failed jobs',c.failed_video_jobs,'need attention'],['Shipments',c.shipments,'tracking records'],['Wallet transactions',c.wallet_transactions,'coin activity'],['Memberships',c.memberships,'premium records']].map(x=>'<div class="admin-stat"><span>'+esc(x[0])+'</span><b>'+Number(x[1]||0).toLocaleString()+'</b><small>'+esc(x[2])+'</small></div>').join("")+'</div>'+
 '<div class="admin-section-title"><h2>App health</h2><span>Service checks and operational signals</span></div><div class="admin-health-grid">'+health+'</div><p class="admin-footnote">Private storage is checked with a live bucket probe. AI provider availability is marked unknown unless an active provider check is performed; failed jobs reflect recorded job statuses.</p>'+
 '<div class="admin-section-title"><h2>Users</h2><span>Latest 100 registered accounts</span></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Account</th><th>Joined</th><th>Last sign-in</th><th>Coins</th><th>Plan</th></tr></thead><tbody>'+users+'</tbody></table></div>'+
 '<div class="admin-section-title"><h2>Live visitors</h2><span>Recent tracked sessions · guests do not need accounts</span></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Visitor</th><th>Page</th><th>Last seen</th></tr></thead><tbody>'+visitors+'</tbody></table></div>'+
 '<div class="admin-section-title"><h2>Issue desk</h2><span>Record, investigate and close app issues</span></div><form id="admin-issue-form" class="admin-issue-form"><input name="title" required maxlength="160" placeholder="Issue title (e.g. Video generation failing)"><select name="severity"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option><option value="critical">Critical</option></select><textarea name="details" rows="3" placeholder="What happened? Include steps or error message…"></textarea><button class="primary-btn" type="submit">＋ Record issue</button></form><div class="admin-issue-list">'+issues+'</div>'+
 '<div class="admin-section-title"><h2>Failed video jobs</h2><span>Most recent recorded failures</span></div><div class="admin-fail-list">'+((d.failed_jobs||[]).map(j=>'<article><b>'+esc(j.id)+'</b><span>'+esc(j.error_message||"No error detail saved")+'</span><small>'+new Date(j.updated_at||j.created_at).toLocaleString()+'</small></article>').join("")||'<p class="admin-muted">No failed video jobs recorded.</p>')+'</div>'+
 '<div class="admin-section-title"><h2>Admin tools</h2><span>Operational shortcuts</span></div><div class="admin-tools-grid"><button data-admin-refresh>Run diagnostics</button><button data-admin-scroll="users">Review user accounts</button><button data-admin-scroll="issues">Open issue desk</button><button data-admin-scroll="failed">Review failed jobs</button></div></section>';
}

const ADMIN_ROOMS = [
 {name:"Overview",icon:"grid",desc:"Your whole platform at a glance"},
 {name:"Site Features",icon:"sparkles",desc:"AI tools, access and coin pricing"},
 {name:"Site Settings",icon:"settings",desc:"Branding, platform and configuration"},
 {name:"Site Uploads",icon:"upload",desc:"Central media library and destinations"},
 {name:"Site AI",icon:"wand",desc:"Understand, code, test and improve the site"},
 {name:"Site Monitor",icon:"activity",desc:"Visitors, countries, performance and faults"},
 {name:"User Centre",icon:"users",desc:"Accounts, guests, memberships and activity"},
 {name:"Finance",icon:"wallet",desc:"Coins, memberships and payment records"},
 {name:"API Centre",icon:"plug",desc:"Connected services, keys and API diagnostics"},
 {name:"Issue Desk",icon:"alert-circle",desc:"Investigate and track site problems"},
 {name:"Campaigns",icon:"megaphone",desc:"Welcome screens and media ads"},
 {name:"Announcements",icon:"bell",desc:"Publish and schedule site notices"},
 {name:"Notifications",icon:"message-square",desc:"Manage site-wide user notices"},
 {name:"AI Jobs",icon:"cpu",desc:"Inspect generation queue and failures"},
 {name:"Feature Experiments",icon:"flask-conical",desc:"Manage feature rollouts and experiments"},
 {name:"Appearance",icon:"palette",desc:"Brand identity, logo and theme"},
 {name:"Audit",icon:"clipboard-list",desc:"Review privileged admin activity"},
 {name:"Support",icon:"life-buoy",desc:"Customer support inbox and replies"},
 {name:"Deployment",icon:"cloud",desc:"GitHub, Vercel builds and releases"},
 {name:"Security",icon:"shield-check",desc:"Admin access, secrets and audit trail"},
 {name:"Backups",icon:"database",desc:"Database and media recovery"}
];

// Live Site Control Centre room data and management controls.
let publicSiteConfig = {settings:{},features:[]};
async function loadPublicSiteConfig(){try{const {data,error}=await supabase.functions.invoke("admin-console",{body:{action:"public_config"}});if(error)throw error;if(data?.error)throw new Error(data.error);publicSiteConfig=data||publicSiteConfig;applyPublicAppearance();const brand=String(publicSiteConfig.settings?.brand_name||"Magic Hour");document.title=brand+" | AI Studio";const accent=publicSiteConfig.settings?.accent_color;if(/^#[0-9a-f]{6}$/i.test(accent||""))document.documentElement.style.setProperty("--accent",accent);const icon=publicSiteConfig.settings?.favicon_url;if(icon){const link=document.querySelector('link[rel="icon"]')||document.createElement("link");link.rel="icon";link.href=icon;if(!link.parentNode)document.head.appendChild(link);}const social=publicSiteConfig.settings?.social_image_url;if(social){let meta=document.querySelector('meta[property="og:image"]');if(!meta){meta=document.createElement("meta");meta.setAttribute("property","og:image");document.head.appendChild(meta);}meta.content=social;}render();}catch(error){console.warn("Public site settings unavailable:",error?.message||error);}}
let adminRoomData = {};
let adminRoomBusy = false;
let adminRoomLoading = new Set();
let adminRoomNotice = "";
async function loadAdminRoom(room=activeAdminRoom){
 if(!isAdmin||adminRoomLoading.has(room))return;
 adminRoomLoading.add(room);adminRoomBusy=true;adminRoomNotice="";render();
 try{adminRoomData[room]=await adminConsoleRequest("room_data",{room});}
 catch(error){adminRoomNotice=error?.message||String(error);}
 finally{adminRoomLoading.delete(room);adminRoomBusy=adminRoomLoading.size>0;render();}
}
function adminRoomTable(rows,columns){
 if(!rows?.length)return '<div class="admin-media-empty">No records found.</div>';
 return '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>'+columns.map(c=>'<th>'+esc(c[1])+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+columns.map(c=>'<td>'+esc(String(r[c[0]]??"—"))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
function renderConnectedAdminRoom(room){
 const data=adminRoomData[room]||{};
 const head='<section class="admin-room-panel"><div class="admin-room-heading"><div><span class="admin-room-kicker">MAGIC HOUR / CONTROL CENTRE</span><h2>'+esc(room)+'</h2><p>'+esc(data.description||"Manage this area of Magic Hour using live records and server-verified controls.")+'</p></div><span class="admin-room-mark">'+iconSvg(ADMIN_ROOMS.find(x=>x.name===room)?.icon||"settings",25)+'</span></div>';
 const notice=adminRoomNotice?'<div class="admin-upload-notice" role="status">'+esc(adminRoomNotice)+'</div>':"";
 const refresh='<button class="secondary-btn" type="button" data-admin-room-refresh>↻ Refresh</button>';
 if(!data.loaded)return head+notice+'<div class="admin-media-empty">'+(adminRoomLoading.has(room)?'Loading live records…':'Load this room to view live records.')+'</div>'+refresh+'</section>';
 let body="";
 if(room==="Site Features"){
  body='<div class="admin-section-title"><h2>Tool catalogue</h2><span>Visibility and access settings</span></div><div class="admin-room-cards">'+(data.features||[]).map(f=>'<article class="admin-room-card"><div><b>'+esc(f.name)+'</b><p>'+esc(f.description||f.tool_id)+'</p><small>Tool: '+esc(f.tool_id)+'</small><label>Access<select data-feature-tier="'+esc(f.tool_id)+'"><option value="free" '+(f.access_tier==="free"?"selected":"")+'>Free</option><option value="pro" '+(f.access_tier==="pro"?"selected":"")+'>Pro</option><option value="restricted" '+(f.access_tier==="restricted"?"selected":"")+'>Restricted</option></select></label><label>Coin cost<input type="number" min="0" max="100000" data-feature-cost="'+esc(f.tool_id)+'" value="'+Number(f.coin_cost||0)+'"></label></div><label class="admin-toggle"><input type="checkbox" data-feature-enabled="'+esc(f.tool_id)+'" '+(f.enabled?'checked':'')+'> Enabled</label></article>').join('')+'</div><p class="admin-room-note">Coin cost is saved as catalogue pricing. It does not override provider-side billing rules until that tool’s billing service is connected to this setting.</p>';
 }else if(room==="Site Settings"){
  body='<form id="admin-settings-form" class="admin-campaign-form"><h3>Platform settings</h3><label>Site announcement<input name="announcement" value="'+esc(data.settings?.announcement||'')+'" maxlength="240"></label><label>Homepage headline<input name="homepage_headline" value="'+esc(data.settings?.homepage_headline||'')+'" maxlength="140"></label><label>Support email<input name="support_email" value="'+esc(data.settings?.support_email||'')+'" type="email"></label><label class="admin-campaign-placements"><span><input type="checkbox" name="maintenance_mode" '+(data.settings?.maintenance_mode?'checked':'')+'> Maintenance mode (admin access remains available)</span></label><button class="primary-btn" type="submit">Save platform settings</button></form>';
 }else if(room==="Site Monitor"){
  body='<div class="admin-section-title"><h2>Service health</h2></div><div class="admin-room-cards">'+(data.health||[]).map(h=>'<article class="admin-room-card"><div><b>'+esc(h.name)+'</b><p>'+esc(h.detail)+'</p></div><span class="admin-room-status">'+esc(h.status)+'</span></article>').join('')+'</div><div class="admin-stat-grid">'+[['Registered users',data.counts?.users],['Guest sessions',data.counts?.guests],['Live guests (5m)',data.counts?.active_guests],['Client errors (24h)',data.counts?.client_errors_24h],['Page loads (24h)',data.counts?.page_loads_24h],['Avg load time (ms)',data.counts?.average_page_load_ms],['Projects',data.counts?.projects],['Assets',data.counts?.assets],['Failed jobs',data.counts?.failed_jobs],['Shipments',data.counts?.shipments]].map(x=>'<div class="admin-stat"><span>'+x[0]+'</span><b>'+Number(x[1]||0).toLocaleString()+'</b><small>Live database count</small></div>').join('')+'</div><div class="admin-section-title"><h2>Recent visitor sessions</h2><span>Latest 50 tracked sessions</span></div>'+adminRoomTable(data.visitors,[['visitor_id','Visitor ID'],['user_id','User ID'],['last_path','Last page'],['visits','Visits'],['last_seen_at','Last seen']])+'<div class="admin-section-title"><h2>Recent client events</h2><span>Latest 100 browser events and page-load measurements</span></div>'+adminRoomTable(data.telemetry,[['created_at','Date'],['event_type','Event'],['message','Message'],['path','Page'],['duration_ms','Load ms']])+'<div class="admin-section-title"><h2>Recent failed jobs</h2></div>'+adminRoomTable(data.failed_jobs,[['id','Job'],['status','Status'],['error_message','Error'],['updated_at','Updated']]);
 }else if(room==="User Centre"){
  body='<div class="admin-section-title"><h2>Registered accounts</h2><span>Showing '+(data.users||[]).length+' of '+Number(data.counts?.registered_users||0).toLocaleString()+' accounts</span></div><input id="admin-user-search" class="admin-user-search" type="search" placeholder="Search account email, membership or verification status">'+adminRoomTable(data.users,[['email','Email'],['created_at','Joined'],['last_sign_in_at','Last sign-in'],['wallet_balance','Coins'],['membership','Membership'],['confirmed','Email verified']])+'<div class="admin-section-title"><h2>Guest visitors</h2><span>Recent sessions</span></div>'+adminRoomTable(data.guests,[['visitor_id','Visitor ID'],['last_path','Last page'],['visits','Visits'],['last_seen_at','Last seen']]);
 }else if(room==="Finance"){
  body='<form id="admin-wallet-adjust-form" class="admin-campaign-form"><h3>Adjust user coins</h3><label>Account email<input name="email" type="email" required placeholder="user@example.com"></label><label>Coin amount<input name="amount" type="number" step="1" required placeholder="Positive adds; negative deducts"></label><label>Reason<input name="description" maxlength="240" required></label><button class="primary-btn" type="submit">Apply wallet adjustment</button></form><form id="admin-membership-form" class="admin-campaign-form"><h3>Grant or renew membership</h3><label>Account email<input name="email" type="email" required></label><label>Plan name<input name="plan_name" required maxlength="80" placeholder="Magic Hour Pro"></label><label>Duration in days<input name="days" type="number" min="1" max="3650" value="30" required></label><div class="admin-campaign-placements"><label><input type="checkbox" name="unlimited_generations"> Unlimited generations</label><label><input type="checkbox" name="unlimited_duration"> Unlimited duration</label></div><button class="primary-btn" type="submit">Grant membership</button></form><div class="admin-stat-grid">'+[['Wallet transactions',data.counts?.transactions],['Active memberships',data.counts?.memberships],['Coin balance total',data.counts?.coins],['Paystack orders',data.counts?.payment_orders],['Successful payments',data.counts?.successful_payments],['Paid amount in latest 100 orders (NGN)',Number(data.counts?.recent_paid_ngn||0)]].map(x=>'<div class="admin-stat"><span>'+x[0]+'</span><b>'+Number(x[1]||0).toLocaleString()+'</b><small>Current records</small></div>').join('')+'</div><div class="admin-section-title"><h2>Paystack payment orders</h2><span>Latest 100 orders · successful orders only count as revenue</span></div>'+adminRoomTable(data.payments,[['created_at','Created'],['email','Account'],['product_key','Product'],['amount_ngn','Amount (NGN)'],['coins','Coins'],['status','Status'],['reference','Reference'],['paystack_transaction_id','Paystack transaction'],['paid_at','Paid at']])+'<div class="admin-section-title"><h2>Recent wallet transactions</h2></div>'+adminRoomTable(data.transactions,[['created_at','Date'],['email','Account'],['transaction_type','Type'],['amount','Coins'],['description','Description'],['reference','Reference']])+'<div class="admin-section-title"><h2>Memberships</h2></div>'+adminRoomTable(data.memberships,[['email','Account'],['plan_name','Plan'],['membership_status','Status'],['started_at','Started'],['expires_at','Expires'],['unlimited_generations','Unlimited generations']])+'<div class="admin-section-title"><h2>API billing records</h2></div>'+adminRoomTable(data.api_billing,[['created_at','Date'],['email','Account'],['endpoint','Endpoint'],['amount','Recorded amount'],['status','Status'],['refunded_at','Refunded at']]);
 }else if(room==="API Centre"){
  body='<div class="admin-section-title"><h2>Developer API keys</h2><span>Secrets are never displayed here</span></div>'+((data.keys||[]).map(k=>'<article class="admin-campaign-row"><div><b>'+esc(k.name)+'</b><small>'+esc(k.key_prefix)+' · '+new Date(k.created_at).toLocaleString()+'</small><span class="admin-campaign-status">'+(k.revoked_at?"Revoked":"Active")+'</span></div>'+(k.revoked_at?"":'<button class="secondary-btn" data-api-revoke="'+esc(k.id)+'">Revoke key</button>')+'</article>').join("")||'<div class="admin-media-empty">No API keys found.</div>')+'<div class="admin-section-title"><h2>Recent API requests</h2></div>'+adminRoomTable(data.usage,[['created_at','Date'],['endpoint','Endpoint'],['http_method','Method'],['status_code','Status']]);
 }else if(room==="Issue Desk"){
  body='<form id="admin-room-issue-form" class="admin-issue-form"><input name="title" required maxlength="160" placeholder="Issue title"><select name="severity"><option>low</option><option selected>medium</option><option>high</option><option>critical</option></select><textarea name="details" rows="3" placeholder="Issue details and reproduction steps"></textarea><button class="primary-btn" type="submit">Record issue</button></form><div class="admin-section-title"><h2>Issue register</h2></div>'+(data.issues||[]).map(x=>'<form class="admin-campaign-form" data-admin-issue="'+esc(x.id)+'"><div class="admin-campaign-row"><div><b>'+esc(x.title)+'</b><small>'+esc(x.severity)+' · '+new Date(x.created_at).toLocaleString()+'</small></div><span class="admin-campaign-status">'+esc(x.status)+'</span></div><p>'+esc(x.details||"No reproduction details")+'</p><label>Status<select name="status"><option value="open" '+(x.status==="open"?"selected":"")+'>Open</option><option value="investigating" '+(x.status==="investigating"?"selected":"")+'>Investigating</option><option value="resolved" '+(x.status==="resolved"?"selected":"")+'>Resolved</option><option value="ignored" '+(x.status==="ignored"?"selected":"")+'>Ignored</option></select></label><label>Admin notes<textarea name="admin_notes" rows="2">'+esc(x.admin_notes||"")+'</textarea></label><button class="secondary-btn" type="submit">Update issue</button></form>').join("")||'<div class="admin-media-empty">No issues recorded.</div>';
 }else if(room==="Announcements"){
  body='<div class="admin-section-title"><h2>Announcements</h2></div><form id="admin-announcement-form" class="admin-campaign-form"><label>Title<input name="title" required maxlength="120"></label><label>Message<textarea name="body" rows="3" required maxlength="1000"></textarea></label><div class="admin-campaign-dates"><label>Starts<input name="starts_at" type="datetime-local"></label><label>Ends<input name="ends_at" type="datetime-local"></label></div><button class="primary-btn" type="submit">Publish announcement</button></form>'+((data.announcements||[]).map(a=>'<article class="admin-campaign-row"><div><b>'+esc(a.title)+'</b><small>'+esc(a.body)+'</small><span class="admin-campaign-status">'+(a.active?"Active":"Paused")+'</span></div><button class="secondary-btn" data-announcement-toggle="'+esc(a.id)+'" data-active="'+(!a.active)+'">'+(a.active?"Pause":"Activate")+'</button><button class="text-btn" data-announcement-delete="'+esc(a.id)+'">Delete</button></article>').join("")||'<div class="admin-media-empty">No announcements yet.</div>')+'<p class="admin-room-note">Image/video campaigns are managed below through the Campaign Manager.</p>';
 }else if(room==="Feature Experiments"){
  body='<form id="admin-experiment-form" class="admin-campaign-form"><h3>Create experiment</h3><label>Experiment name<input name="name" required maxlength="120"></label><label>Description<textarea name="description" rows="2" maxlength="500"></textarea></label><label>Traffic allocation (%)<input name="traffic_percent" type="number" min="0" max="100" value="0"></label><label>Variants (comma separated)<input name="variants" value="control,variant-a"></label><button class="primary-btn" type="submit">Save experiment</button></form>'+((data.experiments||[]).map(x=>'<article class="admin-campaign-row"><div><b>'+esc(x.name)+'</b><small>'+esc(x.description||"No description")+' · '+Number(x.traffic_percent||0)+'% traffic · '+esc((x.variants||[]).join(", "))+'</small><span class="admin-campaign-status">'+(x.enabled?"Running":"Paused")+'</span></div><button class="secondary-btn" data-experiment-toggle="'+esc(x.id)+'" data-enabled="'+(!x.enabled)+'">'+(x.enabled?"Pause":"Enable")+'</button></article>').join("")||'<div class="admin-media-empty">No experiments configured.</div>')+'<p class="admin-room-note">Rollout settings are stored here; an experiment must be connected to a live feature before it changes customer traffic.</p>';
 }else if(room==="Support"){
  body=(data.tickets||[]).map(t=>'<form class="admin-campaign-form" data-support-ticket="'+esc(t.id)+'"><div class="admin-campaign-row"><div><b>'+esc(t.subject)+'</b><small>'+esc(t.email)+' · '+new Date(t.created_at).toLocaleString()+'</small><span class="admin-campaign-status">'+esc(t.status)+'</span></div></div><p>'+esc(t.message)+'</p><label>Status<select name="status"><option value="open" '+(t.status==="open"?"selected":"")+'>Open</option><option value="in_progress" '+(t.status==="in_progress"?"selected":"")+'>In progress</option><option value="resolved" '+(t.status==="resolved"?"selected":"")+'>Resolved</option></select></label><label>Admin reply<textarea name="admin_reply" rows="2">'+esc(t.admin_reply||"")+'</textarea></label><button class="primary-btn" type="submit">Save ticket</button></form>').join("")||'<div class="admin-media-empty">No support tickets yet.</div>';
 }else if(room==="AI Jobs"){
  body='<div class="admin-stat-grid">'+[['Queued',data.counts?.queued],['Processing',data.counts?.running],['Failed',data.counts?.failed],['Completed',data.counts?.completed]].map(x=>'<div class="admin-stat"><span>'+x[0]+'</span><b>'+Number(x[1]||0).toLocaleString()+'</b><small>Recorded jobs</small></div>').join('')+'</div><div class="admin-section-title"><h2>Generation jobs</h2></div>'+adminRoomTable(data.jobs,[['created_at','Created'],['id','Job ID'],['status','Status'],['duration_seconds','Seconds'],['credit_cost','Credit cost'],['error_message','Error']]);
 }else if(room==="Audit"){
  body='<div class="admin-section-title"><h2>Privileged action history</h2><span>Latest 200 entries</span></div>'+adminRoomTable(data.audit,[['created_at','Date'],['actor_email','Admin'],['action','Action'],['target','Target'],['details','Details']]);
 }else if(room==="Appearance"){
  body='<form id="admin-appearance-form" class="admin-campaign-form"><h3>Brand and appearance</h3><label>Brand name<input name="brand_name" maxlength="80" value="'+esc(data.settings?.brand_name||"Magic Hour")+'"></label><label>Logo image URL<input name="logo_url" type="url" value="'+esc(data.settings?.logo_url||"")+'" placeholder="https://…"></label><label>Favicon URL<input name="favicon_url" type="url" value="'+esc(data.settings?.favicon_url||"")+'" placeholder="https://…"></label><label>Social sharing image URL<input name="social_image_url" type="url" value="'+esc(data.settings?.social_image_url||"")+'" placeholder="https://…"></label><label>Accent colour<input name="accent_color" type="color" value="'+esc(data.settings?.accent_color||"#a879ef")+'"></label><button class="primary-btn" type="submit">Save appearance</button></form>';
 }else if(room==="Notifications"){
  body='<div class="admin-section-title"><h2>Operations inbox</h2><span>'+(data.alerts||[]).length+' open alerts</span></div>'+((data.alerts||[]).map(a=>'<article class="admin-campaign-row"><div><b>'+esc(a.title)+'</b><small>'+esc(a.kind)+' · '+esc(a.status)+' · '+new Date(a.created_at).toLocaleString()+'</small><p>'+esc(a.detail)+'</p></div><button class="secondary-btn" type="button" data-admin-room="'+esc(a.room)+'">Open '+esc(a.room)+'</button></article>').join('')||'<div class="admin-media-empty">No open operational alerts. Everything in the monitored inbox is clear.</div>');
 }else if(room==="Security"){
  body='<div class="admin-section-title"><h2>Admin access registry</h2><span>'+(data.admins||[]).length+' assigned role(s)</span></div>'+adminRoomTable(data.admins,[['email','Account'],['role','Role'],['created_at','Added']])+'<div class="admin-section-title"><h2>Privileged action audit</h2></div>'+adminRoomTable(data.audit,[['created_at','Date'],['actor_email','Admin'],['action','Action'],['target','Target'],['details','Details']]);
 }else if(room==="Deployment"){
  body='<div class="admin-room-cards"><article class="admin-room-card"><div><b>Source repository</b><p>muskysocial/MuskyP2V-AI-Studio · magic-hour-site-control-centre · Draft PR #75</p><p><a href="https://github.com/muskysocial/MuskyP2V-AI-Studio/pull/75" target="_blank" rel="noopener">Open review pull request</a></p></div><span class="admin-room-status">Review only</span></article><article class="admin-room-card"><div><b>Production deployment</b><p>Changes remain on the review branch until explicitly approved. Vercel release controls are not connected inside this panel.</p></div><span class="admin-room-status">Approval required</span></article></div>'+adminRoomTable(data.jobs,[['created_at','Created'],['status','Status'],['error_message','Latest error'],['updated_at','Updated']]);
 }else if(room==="Backups"){
  body='<div class="admin-room-cards"><article class="admin-room-card"><div><b>Database recovery</b><p>Use Supabase managed backups and point-in-time recovery from the project dashboard.</p></div><span class="admin-room-status">Provider-managed</span></article><article class="admin-room-card"><div><b>Media recovery</b><p>Private storage bucket inventory and metadata are retained in Supabase.</p></div><span class="admin-room-status">Private bucket</span></article><article class="admin-room-card"><div><b>Restore validation</b><p>Never claim a backup is restorable until a restore test has been completed.</p></div><span class="admin-room-status">Test required</span></article></div>';
 }else{
  body='<div class="admin-room-cards">'+(data.cards||[]).map(x=>'<article class="admin-room-card"><div><b>'+esc(x[0])+'</b><p>'+esc(x[1])+'</p></div><span class="admin-room-status">'+esc(x[2])+'</span></article>').join('')+'</div>';
 }
 return head+notice+body+refresh+'</section>';
}

function renderAdminRoomPanel(room){
 const panels = {
  "Site Features":{intro:"Control which creative tools appear in Magic Hour and how each one is offered.",items:[["AI tool catalogue","Inventory and availability controls","Connect existing tool registry"],["Access rules","Free, Pro and restricted access","Integration pending"],["Coin pricing","Per-tool generation costs","Integration pending"],["Tool health","Availability and failed requests","Integration pending"]]},
  "Site Settings":{intro:"Manage the global identity and behaviour of the Magic Hour platform.",items:[["Brand identity","Site name, logo, favicon and social preview","Existing site assets"],["Homepage","Hero content, sections and navigation","Integration pending"],["Accounts","Registration, login and session policies","Supabase Auth"],["Platform settings","Maintenance mode, SEO and notifications","Integration pending"]]},
  "Site Uploads":{intro:"Upload an asset once, choose its destination, preview it and publish it to the right place.",items:[["Homepage media","Banners, hero images and backgrounds","Destination integration pending"],["Welcome screen ads","Campaign artwork shown on app return","Campaign integration pending"],["AI tool media","Tool thumbnails, icons and examples","Destination integration pending"],["Media library","Search, replace and inspect existing files","Supabase Storage connection pending"]]},
  "Site AI":{intro:"A development workspace that can understand the complete repository and work through approved changes.",items:[["Ask mode","Explain architecture and answer project questions","Planned"],["Code mode","Generate complete files and downloadable packages","Planned"],["Implementation mode","Create a branch, edit files and prepare a pull request","GitHub connector available here; site OAuth still required"],["Project memory","Index files, database schema and past changes","Planned"],["Testing","Run checks and inspect deployment previews","Planned"]]},
  "Site Monitor":{intro:"Live operational intelligence. Only measured signals will be shown as live metrics.",items:[["Visitor activity","Registered users, guests and active sessions","Existing heartbeat and admin-console data"],["Geography","Country and regional traffic","Geolocation instrumentation pending"],["Performance","Page timing, API latency and error rates","Instrumentation pending"],["Service health","Supabase, storage, AI jobs and deployment checks","Existing partial health checks"]]},
  "User Centre":{intro:"Manage the people using Magic Hour, including signed-in accounts and guest visitors.",items:[["Registered accounts","Profiles, last sign-in and account status","Existing admin dashboard data"],["Guest visitors","Sessions, last page and visit history","Existing visitor tracking"],["Memberships","Plan, activation and expiry","Existing membership records"],["Wallets","Coin balance and transaction history","Existing wallet records"]]},
  "Finance":{intro:"A single place to reconcile wallet activity, subscriptions and payments.",items:[["Coin transactions","Purchases, spending, rewards and refunds","Existing wallet transactions"],["Membership revenue","Plan activations and expiry","Existing membership records"],["Payment orders","Payment status and references","Existing payment records"],["Reports","Revenue summaries and exports","Integration pending"]]},
  "API Centre":{intro:"Manage service integrations and diagnose failed API requests.",items:[["AI providers","Generation API connectivity and usage","Provider integrations need inventory"],["Developer API","API keys and request usage","Existing developer panel"],["Webhooks","Inbound and outbound events","Integration pending"],["Secrets","Server-side credential configuration","Never expose secrets in the browser"]]},
  "Issue Desk":{intro:"Record, investigate, prioritise and resolve operational problems.",items:[["Incident register","Severity, status and notes","Existing issue desk"],["Failed AI jobs","Generation errors and refunds","Existing video-job diagnostics"],["Root-cause analysis","Trace faults to affected services","Site AI integration pending"],["Resolution history","Track fixes and recurrence","Audit integration pending"]]},
  "Campaigns":{intro:"Schedule promotions and control what users see when they open Magic Hour.",items:[["Welcome campaigns","Show a configured welcome experience on app return","Integration pending"],["Advertisements","Images, videos, links and targeting","Integration pending"],["Announcements","In-app messages and notices","Existing announcements table"],["Scheduling","Start dates, end dates and frequency limits","Integration pending"]]},
  "Deployment":{intro:"Track source changes and releases without making unreviewed production changes.",items:[["GitHub repository","Read project files and prepare code changes","Repository accessible to connected GitHub tool"],["Branches and pull requests","Review changes before merging","GitHub connection in this assistant; site connection pending"],["Vercel builds","Build logs and deployment status","Vercel API connection pending"],["Rollback","Return to a previously working release","Deployment integration pending"]]},
  "Security":{intro:"Protect the single administrator account and every privileged operation.",items:[["Administrator identity","Only the authorised owner account can enter","Existing admin_users check"],["Role enforcement","Server-side checks and row-level security","Review required"],["Secrets management","Server-only keys and token rotation","Never store service keys in frontend"],["Audit trail","Record every privileged action","Audit instrumentation pending"]]},
  "Backups":{intro:"Prepare recovery options for the database, uploaded media and releases.",items:[["Database backups","Verify backup schedule and restore points","Supabase backup verification pending"],["Media backups","Protect uploaded assets","Storage backup plan pending"],["Configuration snapshots","Preserve settings before major changes","Planned"],["Recovery tests","Verify that backups can actually be restored","Planned"]]}
 };
 const p=panels[room]||{intro:"This room is part of the Site Control Centre.",items:[]};
 return '<section class="admin-room-panel"><div class="admin-room-heading"><div><span class="admin-room-kicker">MAGIC HOUR / '+esc(room.toUpperCase())+'</span><h2>'+esc(room)+'</h2><p>'+esc(p.intro)+'</p></div><span class="admin-room-mark">'+iconSvg(ADMIN_ROOMS.find(x=>x.name===room)?.icon||"sparkles",25)+'</span></div><div class="admin-room-cards">'+p.items.map(x=>'<article class="admin-room-card"><div><b>'+esc(x[0])+'</b><p>'+esc(x[1])+'</p></div><span class="admin-room-status">'+esc(x[2])+'</span></article>').join("")+'</div><p class="admin-room-note">This is the room structure and integration map. Items marked pending are not yet connected to live controls; they will not display fabricated data or claim an action has been completed.</p></section>';
}
function renderAdminUploads(){
 const siteAssets=userAssets.filter(a=>a.storage_path?.startsWith((currentUser?.id||"")+"/site-media/"));
 const rows=siteAssets.map(a=>{
  const media=a.mime_type?.startsWith("image/")&&a.signedUrl?'<img src="'+esc(a.signedUrl)+'" alt="'+esc(a.file_name)+'" loading="lazy">':a.mime_type?.startsWith("video/")&&a.signedUrl?'<video src="'+esc(a.signedUrl)+'" controls preload="metadata"></video>':a.mime_type==="application/pdf"&&a.signedUrl?'<a class="admin-media-file" href="'+esc(a.signedUrl)+'" target="_blank" rel="noopener">PDF</a>':'<span class="admin-media-file">FILE</span>';
  return '<article class="admin-media-card"><div class="admin-media-preview">'+media+'</div><div class="admin-media-meta"><b>'+esc(a.file_name)+'</b><small>'+esc(a.mime_type||"Unknown type")+' · '+(Number(a.size_bytes||0)/1048576).toFixed(2)+' MB</small><small>'+new Date(a.created_at).toLocaleString()+'</small><span>Private admin library</span><button class="text-btn" type="button" data-admin-delete-asset="'+esc(a.id)+'">Delete file</button></div></article>';
 }).join("");
 return '<section class="admin-room-panel"><div class="admin-room-heading"><div><span class="admin-room-kicker">MAGIC HOUR / CENTRAL MEDIA</span><h2>Site Uploads</h2><p>Upload and preview files in your private admin media library. These files are stored in Magic Hour’s existing private storage bucket.</p></div><span class="admin-room-mark">'+iconSvg("upload",25)+'</span></div>'+
 (adminUploadNotice?'<div class="admin-upload-notice" role="status">'+esc(adminUploadNotice)+'</div>':"")+
 '<form id="admin-media-upload" class="admin-media-upload"><label class="admin-upload-drop" for="admin-media-file"><span>'+iconSvg("upload",26)+'</span><b>Choose media to upload</b><small>Images, MP4/MOV video or PDF · up to 100 MB</small><input id="admin-media-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,application/pdf" required></label><div class="admin-upload-selected" id="admin-upload-selected">'+(selectedAdminUploadFile?esc(selectedAdminUploadFile.name):"No file selected")+'</div><button class="primary-btn" type="submit" '+(adminUploadBusy||!selectedAdminUploadFile?'disabled':'')+'>'+(adminUploadBusy?"Uploading…":"Upload to private media library")+'</button></form>'+
 '<div class="admin-media-library-head"><div><h3>Admin media library</h3><p>'+siteAssets.length+' file(s) in this account</p></div></div>'+
 (siteAssets.length?'<div class="admin-media-grid">'+rows+'</div>':'<div class="admin-media-empty">No admin uploads yet. Choose a file above to add the first one.</div>')+
 '<p class="admin-room-note">Files remain private by default. The Campaigns room can publish selected images and videos to the welcome screen and homepage using short-lived signed URLs. Other destinations, such as AI tool cards, are not connected yet.</p></section>';
}
function renderAdminCampaigns(){
 const media=userAssets.filter(a=>a.storage_path?.startsWith((currentUser?.id||"")+"/site-media/")&&(a.mime_type?.startsWith("image/")||a.mime_type?.startsWith("video/")));
 const edit=editingCampaign||{};
 const options=media.map(a=>'<option value="'+esc(a.id)+'" '+(edit.asset_id===a.id?'selected':'')+'>'+esc(a.file_name)+' ('+esc(a.mime_type)+')</option>').join("");
 const rows=adminCampaigns.map(c=>{
  const asset=Array.isArray(c.mh_assets)?c.mh_assets[0]:c.mh_assets;
  return '<article class="admin-campaign-row"><div><b>'+esc(c.title)+'</b><small>'+esc(asset?.file_name||"Media")+' · '+(c.placements||[]).join(" + ")+'</small><small>'+new Date(c.starts_at).toLocaleString()+' – '+(c.ends_at?new Date(c.ends_at).toLocaleString():"No expiry")+'</small><span class="admin-campaign-status">'+esc(c.status)+'</span></div><div class="admin-campaign-actions"><button class="secondary-btn" data-campaign-edit="'+esc(c.id)+'">Edit</button>'+(c.status==="active"?'<button class="secondary-btn" data-campaign-status="'+esc(c.id)+'" data-status="paused">Pause</button>':'<button class="secondary-btn" data-campaign-status="'+esc(c.id)+'" data-status="active">Activate</button>')+(c.status==="archived"?"":'<button class="secondary-btn" data-campaign-status="'+esc(c.id)+'" data-status="archived">Archive</button>')+'<button class="text-btn" data-campaign-delete="'+esc(c.id)+'">Delete</button></div></article>';
 }).join("");
 return '<section class="admin-room-panel"><div class="admin-room-heading"><div><span class="admin-room-kicker">MAGIC HOUR / PROMOTIONS</span><h2>Campaigns & Announcements</h2><p>Publish media to the welcome screen on every return visit and to homepage banners.</p></div><span class="admin-room-mark">'+iconSvg("megaphone",25)+'</span></div>'+
 (adminCampaignNotice?'<div class="admin-upload-notice" role="status">'+esc(adminCampaignNotice)+'</div>':"")+
 '<form id="admin-campaign-form" class="admin-campaign-form"><h3>'+(edit.id?"Edit campaign":"Create campaign")+'</h3><label>Campaign title<input name="title" maxlength="120" required value="'+esc(edit.title||"")+'" placeholder="Campaign title"></label><label>Message<textarea name="message" rows="2" maxlength="500">'+esc(edit.message||"")+'</textarea></label><label>Media from Site Uploads<select name="asset_id" required><option value="">Choose image or video</option>'+options+'</select></label><div class="admin-campaign-placements"><b>Placements</b><label><input type="checkbox" name="placements" value="welcome" '+((edit.placements||["welcome","homepage"]).includes("welcome")?"checked":"")+'> Welcome screen (every return visit)</label><label><input type="checkbox" name="placements" value="homepage" '+((edit.placements||["welcome","homepage"]).includes("homepage")?"checked":"")+'> Homepage banner</label></div><div class="admin-campaign-dates"><label>Start date<input type="datetime-local" name="starts_at" value="'+(edit.starts_at?new Date(edit.starts_at).toISOString().slice(0,16):"")+'"></label><label>Expiry date<input type="datetime-local" name="ends_at" value="'+(edit.ends_at?new Date(edit.ends_at).toISOString().slice(0,16):"")+'"></label></div><label>Optional HTTPS link<input type="url" name="link_url" value="'+esc(edit.link_url||"")+'" placeholder="https://example.com"></label><div class="admin-campaign-form-actions"><button class="primary-btn" type="submit">'+(edit.id?"Save changes":"Save draft")+'</button>'+(edit.id?'<button class="secondary-btn" type="button" data-campaign-cancel-edit>Cancel</button>':"")+'</div></form>'+
 '<div class="admin-media-library-head"><div><h3>Campaign library</h3><p>'+adminCampaigns.length+' campaign(s) · '+(adminCampaignLoading?"Loading…":"Only activated, in-date campaigns are delivered")+'</p></div><button class="secondary-btn" type="button" data-campaign-refresh>Refresh</button></div>'+
 (adminCampaignLoading?'<div class="admin-media-empty">Loading campaigns…</div>':rows||'<div class="admin-media-empty">No campaigns yet. Upload media in Site Uploads first.</div>')+
 '<p class="admin-room-note">Campaign files remain private. The campaign service generates short-lived signed viewing links only for active campaigns within their schedule. Expired campaigns are excluded automatically.</p></section>';
}
function renderAdminDashboard(){
 if(!isAdmin)return renderAdminOverview();
 const nav=ADMIN_ROOMS.map(r=>'<button type="button" class="admin-room-link '+(activeAdminRoom===r.name?'active':'')+'" data-admin-room="'+esc(r.name)+'"><span>'+iconSvg(r.icon,18)+'</span><b>'+esc(r.name)+'</b><small>'+esc(r.desc)+'</small></button>').join("");
 const content=activeAdminRoom==="Overview"?renderAdminOverview():activeAdminRoom==="Site Uploads"?renderAdminUploads():activeAdminRoom==="Campaigns"?renderAdminCampaigns():renderConnectedAdminRoom(activeAdminRoom);
 return '<section class="admin-control-centre"><header class="admin-control-head"><div><div class="eyebrow">MAGIC HOUR / PRIVATE ADMINISTRATION</div><h1>Site Control Centre</h1><p>One secure room for managing, monitoring and improving your entire website.</p></div><span class="admin-owner-chip">'+iconSvg("shield-check",15)+' Owner access</span></header><nav class="admin-room-grid" aria-label="Site Control Centre rooms">'+nav+'</nav><div class="admin-room-main">'+content+'</div></section>';
}

function renderGeneric(){
 const map={"Library":["library","Your Library","Your private uploaded files."],"Projects":["grid","Your Projects","Your saved creative projects."],"Settings":["settings","Settings","Manage your profile and account."],"All tools":["sparkles","Explore all tools","Choose a creative workspace."],"Create":["plus","Create something new","Choose a tool to start a project."],"Notifications":["bell","Notifications","You're all caught up."]};
 const [icon,title,desc]=map[page]||map["All tools"];
 const projectsHtml=userProjects.length?userProjects.map(p=>`<button class="account-panel project-row" data-project="${p.id}"><b>${esc(p.title)}</b><p>${esc(p.tool_id)} · ${esc(p.status)} · ${new Date(p.created_at).toLocaleDateString()}</p></button>`).join(""):'<div class="notice">No projects yet. Open a tool and upload a file to create your first project.</div>';
 const assetsHtml=userAssets.length?`<div class="history-grid">${userAssets.map(a=>`<div class="history-item"><button class="history-image" ${a.mime_type?.startsWith("video/")?`data-asset="${a.id}"`:`data-preview="${esc(a.signedUrl||"")}"`} aria-label="View ${esc(a.file_name)}">${a.mime_type?.startsWith("image/")&&a.signedUrl?`<img src="${esc(a.signedUrl)}" alt="${esc(a.file_name)}" loading="lazy">`:a.mime_type?.startsWith("video/")&&a.signedUrl?`<video src="${esc(a.signedUrl)}" muted playsinline></video>`:`<span class="history-file">${iconSvg("folder",24)}</span>`}</button><span class="history-name">${esc(a.file_name)}</span><small>${new Date(a.created_at).toLocaleDateString()}</small><button class="history-delete" data-delete-asset="${a.id}" aria-label="Delete ${esc(a.file_name)}">Delete</button></div>`).join("")}</div>`:'<div class="notice">Your uploaded files will appear here.</div>';
 return `<div class="empty-panel"><div class="empty-icon">${iconSvg(icon,34)}</div><h1 class="page-title">${title}</h1><p class="page-sub">${desc}</p>
 ${page==="Settings"?`<div class="account-panel"><b>Signed in account</b><p>${esc(currentUser?.email||"")}</p><p>Wallet balance: ${walletBalance.toLocaleString()} coins</p><button class="secondary-btn" data-action="signout">Sign out</button></div>${renderDeveloperPanel()}${publicSiteConfig.settings?.support_email?`<p class="support-contact-line">Support email: <a href="mailto:${esc(publicSiteConfig.settings.support_email)}">${esc(publicSiteConfig.settings.support_email)}</a></p>`:""}<form id="support-ticket-form" class="admin-campaign-form"><h3>Contact Magic Hour support</h3><label>Email<input name="email" type="email" required value="${esc(currentUser?.email||"")}"></label><label>Subject<input name="subject" required maxlength="160"></label><label>How can we help?<textarea name="message" rows="4" required maxlength="5000"></textarea></label><button class="primary-btn" type="submit">Send support request</button><p class="admin-room-note" id="support-ticket-notice"></p></form><div class="account-panel"><b>Your support requests</b>${userSupportTickets.length?userSupportTickets.map(t=>'<article class="admin-campaign-row"><div><b>'+esc(t.subject)+'</b><small>'+new Date(t.created_at).toLocaleString()+' · '+esc(t.status.replace("_"," "))+'</small><p>'+esc(t.message||"")+'</p>'+(t.admin_reply?'<p><strong>Magic Hour reply:</strong> '+esc(t.admin_reply)+'</p>':'<small>Waiting for a support response.</small>')+'</div></article>').join(""):'<p class="admin-room-note">Your submitted support requests and replies will appear here.</p>'}</div>`:""}
 ${page==="Projects"?`<div class="account-list">${projectsHtml}</div>`:""}
 ${page==="Library"?`<div class="account-list">${assetsHtml}</div>`:""}
 ${page==="All tools"?`<div class="tools-grid">${tools.filter(t=>publicSiteConfig.features?.find(f=>f.tool_id===t.id)?.enabled!==false).map(toolCard).join("")}</div><div class="more-grid" style="margin-top:14px">${moreTools.map(([n,i])=>`<button class="mini-tool" data-extra="${esc(n)}"><span>${iconSvg(i,23)}</span><b>${n}</b></button>`).join("")}</div>`:""}
 ${!["Settings","Projects","Library","All tools"].includes(page)?'<button class="primary-btn" data-page="Home">Back to Home</button>':""}</div>`;
}
async function loadAccountData(){
  if(!currentUser)return;
  const uid=currentUser.id;
  const [wallet,projects,assets,transactions,videoCredits,membership,shipments,supportTickets]=await Promise.all([
    supabase.from("mh_wallets").select("balance").eq("user_id",uid).maybeSingle(),
    supabase.from("mh_projects").select("id,title,tool_id,status,created_at,updated_at").eq("user_id",uid).order("updated_at",{ascending:false}).limit(100),
    supabase.from("mh_assets").select("id,project_id,storage_path,file_name,mime_type,size_bytes,created_at").eq("user_id",uid).order("created_at",{ascending:false}).limit(100),
    supabase.from("mh_wallet_transactions").select("id,amount,transaction_type,description,reference,created_at").eq("user_id",uid).order("created_at",{ascending:false}).limit(50),
    supabase.from("mh_video_credit_balances").select("credit_date,credits_remaining").eq("user_id",uid).maybeSingle(),
    supabase.from("mh_memberships").select("plan_key,plan_name,started_at,expires_at,unlimited_generations,unlimited_duration").eq("user_id",uid).maybeSingle(),
    supabase.from("ms_shipments").select("id,tracking_code,tracking_slug,carrier,transport_mode,sender_name,recipient_name,origin,destination,origin_country,destination_country,origin_city,destination_city,operator_name,current_location,current_lat,current_lng,public_status_label,barcode_value,item_names,departure_at,arrival_at,status,created_at,is_obstructed,obstruction_reason,obstruction_location,obstructed_at,progress_percent,paused_progress,paused_duration_seconds").eq("user_id",uid).order("created_at",{ascending:false}).limit(50),
    supabase.from("mh_support_tickets").select("id,subject,message,status,admin_reply,created_at,updated_at").eq("user_id",uid).order("created_at",{ascending:false}).limit(20)
  ]);
  if(!wallet.error&&wallet.data)walletBalance=Number(wallet.data.balance)||0;
  else if(wallet.error)console.warn("Wallet load:",wallet.error.message);
  if(!projects.error)userProjects=projects.data||[];else console.warn("Projects load:",projects.error.message);
  if(!assets.error){userAssets=await Promise.all((assets.data||[]).map(async a=>{const {data:signed}=await supabase.storage.from("magic-hour-assets").createSignedUrl(a.storage_path,3600);return {...a,signedUrl:signed?.signedUrl||""};}));}else console.warn("Assets load:",assets.error.message);
  if(!transactions.error)walletTransactions=transactions.data||[];else console.warn("Wallet history:",transactions.error.message);
  membershipInfo=!membership.error&&membership.data&&(membership.data.unlimited_duration||!!membership.data.expires_at&&new Date(membership.data.expires_at)>new Date())?membership.data:null;
  userShipments=!shipments.error?(shipments.data||[]):[];
  userSupportTickets=!supportTickets.error?(supportTickets.data||[]):[];
  const utcDay=new Date().toISOString().slice(0,10);
  dailyClaimAvailable=!walletTransactions.some(t=>t.description==="Daily coin claim"&&String(t.created_at).slice(0,10)===utcDay);
  dailyVideoCredits=!videoCredits.error&&videoCredits.data?.credit_date===utcDay?Number(videoCredits.data.credits_remaining):100;
  if(currentUser)render();
}
let shipmentMapInstance=null,shipmentMapTimer=null,shipmentMapSignature="";
function loadShipmentMapLibrary(){return new Promise((resolve,reject)=>{if(window.L)return resolve();const cssUrls=["https://unpkg.com/leaflet@1.9.4/dist/leaflet.css","https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css"];if(!document.querySelector("link[data-shipment-leaflet]")){const link=document.createElement("link");link.rel="stylesheet";link.href=cssUrls[0];link.dataset.shipmentLeaflet="1";link.onerror=()=>{link.href=cssUrls[1];};document.head.appendChild(link);}const urls=["https://unpkg.com/leaflet@1.9.4/dist/leaflet.js","https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"];let index=0;const load=()=>{if(window.L)return resolve();if(index>=urls.length)return reject(new Error("Map library could not be loaded. Check your internet connection."));let script=document.querySelector("script[data-shipment-leaflet]");if(script)script.remove();script=document.createElement("script");script.src=urls[index++];script.dataset.shipmentLeaflet="1";script.onload=()=>window.L?resolve():load();script.onerror=load;document.head.appendChild(script);};load();});}
async function shipmentGeocodeResult(place){let lastError;for(const url of ["https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q="+encodeURIComponent(place),"https://photon.komoot.io/api/?limit=1&q="+encodeURIComponent(place)]){try{const response=await fetch(url,{headers:{Accept:"application/json"}});if(!response.ok)throw new Error("Location lookup unavailable");const body=await response.json();const row=Array.isArray(body)?body[0]:body.features?.[0]?{lat:body.features[0].geometry.coordinates[1],lon:body.features[0].geometry.coordinates[0],boundingbox:null}:null;if(row)return row;}catch(error){lastError=error;}}throw new Error("Could not locate "+place+". "+(lastError?.message||"Map search unavailable"));}async function shipmentGeocode(place){const row=await shipmentGeocodeResult(place);return [Number(row.lat),Number(row.lon)];}
function shipmentPointAt(points,p){if(points.length<2)return points[0];const lengths=[];let total=0;for(let i=1;i<points.length;i++){const d=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(d);total+=d;}let target=total*p,acc=0;for(let i=0;i<lengths.length;i++){if(acc+lengths[i]>=target){const t=lengths[i]?(target-acc)/lengths[i]:0;return [points[i][0]+(points[i+1][0]-points[i][0])*t,points[i][1]+(points[i+1][1]-points[i][1])*t];}acc+=lengths[i];}return points[points.length-1];}
async function initPublicShipmentMap(data){
const host=document.getElementById("shipment-live-map");if(!host)return;const x=data.shipment;
const signature=[x.id,x.origin,x.destination,x.origin_country,x.destination_country,x.origin_city,x.destination_city,x.current_lat,x.current_lng,(data.events||[]).map(e=>e.id+e.event_type+e.event_details).join("|")].join("::");
if(shipmentMapSignature===signature&&shipmentMapInstance){shipmentMapInstance.invalidateSize();return;}
if(shipmentMapTimer)clearInterval(shipmentMapTimer);if(shipmentMapInstance){shipmentMapInstance.remove();shipmentMapInstance=null;}shipmentMapSignature=signature;
host.innerHTML='<div class="shipment-map-loading">Loading country map, cities and direct route…</div>';
try{
await loadShipmentMapLibrary();
const originLabel=[x.origin_city,x.origin_country].filter(Boolean).join(", ")||x.origin;
const destinationLabel=[x.destination_city,x.destination_country].filter(Boolean).join(", ")||x.destination;
const [from,to]=await Promise.all([shipmentGeocode(originLabel),shipmentGeocode(destinationLabel)]);
let points=[from,to],routeDistance=null,routeDuration=null;if(x.transport_mode==="air"){const a=from,b=to;const dx=b[1]-a[1],dy=b[0]-a[0],bend=Math.min(18,Math.max(2,Math.sqrt(dx*dx+dy*dy)*0.16));const mx=(a[1]+b[1])/2,my=(a[0]+b[0])/2;const len=Math.sqrt(dx*dx+dy*dy)||1;const cx=mx-(dy/len)*bend,cy=my+(dx/len)*bend;points=[];for(let i=0;i<=80;i++){const t=i/80,u=1-t;points.push([u*u*a[0]+2*u*t*cy+t*t*b[0],u*u*a[1]+2*u*t*cx+t*t*b[1]]);}}
if(x.transport_mode==="road"){
const routeUrl="https://router.project-osrm.org/route/v1/driving/"+from[1]+","+from[0]+";"+to[1]+","+to[0]+"?overview=full&geometries=geojson&steps=true";
const response=await fetch(routeUrl);if(!response.ok)throw new Error("Road route service unavailable");const routeData=await response.json();
if(routeData.routes?.[0]?.geometry?.coordinates){points=routeData.routes[0].geometry.coordinates.map(p=>[p[1],p[0]]);routeDistance=routeData.routes[0].distance;routeDuration=routeData.routes[0].duration;}
}
const L=window.L;
shipmentMapInstance=L.map(host,{scrollWheelZoom:true,zoomControl:true}).setView(from,6);
const mapAttribution='&copy; OpenStreetMap contributors &copy; Esri';let tileProviderIndex=-1;let activeTiles=null;const tileProviders=[()=>L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:mapAttribution,crossOrigin:true,keepBuffer:4}),()=>L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",{maxZoom:19,attribution:mapAttribution,crossOrigin:true,keepBuffer:4}),()=>L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{subdomains:"abcd",maxZoom:19,attribution:mapAttribution,crossOrigin:true,keepBuffer:4})];const useNextTileProvider=()=>{if(activeTiles)shipmentMapInstance.removeLayer(activeTiles);tileProviderIndex++;if(tileProviderIndex>=tileProviders.length){const note=document.createElement("div");note.className="shipment-map-error";note.textContent="Map imagery is temporarily unreachable. Check your connection and tap Refresh.";host.appendChild(note);return;}let errors=0;activeTiles=tileProviders[tileProviderIndex]();activeTiles.on("tileerror",()=>{errors++;if(errors>=3)useNextTileProvider();});activeTiles.addTo(shipmentMapInstance);};useNextTileProvider();
const line=L.polyline(points,{color:x.transport_mode==="road"?"#f28b24":"#e9a817",weight:x.transport_mode==="road"?7:4,opacity:.96,dashArray:x.transport_mode==="air"?"10 9":null,lineCap:"round",lineJoin:"round"}).addTo(shipmentMapInstance);
const travelled=L.polyline([],{color:"#168eea",weight:5,opacity:1,lineCap:"round"}).addTo(shipmentMapInstance);
L.marker(from).addTo(shipmentMapInstance).bindPopup("START · "+originLabel);
L.marker(to).addTo(shipmentMapInstance).bindPopup("DESTINATION · "+destinationLabel);
let countryBounds=null;
const sameCountry=x.origin_country&&x.destination_country&&x.origin_country===x.destination_country;
if(sameCountry){
try{
const country=await shipmentGeocodeResult(x.origin_country);
if(country.boundingbox){const b=country.boundingbox.map(Number);countryBounds=L.latLngBounds([b[0],b[2]],[b[1],b[3]]);}
}catch{}
}
if(countryBounds){
shipmentMapInstance.fitBounds(countryBounds,{padding:[28,28]});
const cityNames=shipmentPlaces[x.origin_country]||[];
for(const city of cityNames){
try{
const pos=await shipmentGeocode(city+", "+x.origin_country);
const isEnd=city.toLowerCase()===(x.destination_city||"").toLowerCase();
const isStart=city.toLowerCase()===(x.origin_city||"").toLowerCase();
L.circleMarker(pos,{radius:isStart||isEnd?6:4,color:isStart?"#168eea":isEnd?"#18a66a":"#526b80",weight:2,fillColor:"#fff",fillOpacity:1}).addTo(shipmentMapInstance).bindTooltip(city,{direction:"top",offset:[0,-5]});
}catch{}
}
}else{
shipmentMapInstance.fitBounds(line.getBounds().pad(.16));
}
const icon=L.divIcon({className:"shipment-live-vehicle",html:x.transport_mode==="air"?'<span class="shipment-aircraft-icon" aria-label="Aeroplane in flight"><svg viewBox="0 0 64 64" width="48" height="48" xmlns="http://www.w3.org/2000/svg"><path d="M30 4c2-3 5-3 7 0l5 22 17 12c2 2 1 5-2 5l-17-5-3 17 7 5v4l-12-3-12 3v-4l7-5-3-17-17 5c-3 0-4-3-2-5l17-12z" fill="#fff" stroke="#17243a" stroke-width="2" stroke-linejoin="round"/></svg></span>':'<span>'+(x.transport_mode==="sea"?"🚢":"🚚")+'</span>',iconSize:[52,52],iconAnchor:[26,26]});
const marker=L.marker(Number.isFinite(Number(x.current_lat))&&x.current_lat!==null&&Number.isFinite(Number(x.current_lng))&&x.current_lng!==null?[Number(x.current_lat),Number(x.current_lng)]:from,{icon,zIndexOffset:1000}).addTo(shipmentMapInstance);
const events=(data.events||[]).slice().sort((a,b)=>new Date(b.event_at)-new Date(a.event_at));
const stop=events.find(e=>["stop","blockage","delay"].includes(e.event_type));let stopPoint=null;
if(stop){
const match=(stop.event_details||"").match(/(?:Stop location|Location):\s*([^\n]+)/i);
const location=x.current_location||match?.[1];
if(location){try{stopPoint=await shipmentGeocode(location+", "+(x.origin_country||""));L.circleMarker(stopPoint,{radius:10,color:"#e34b36",fillColor:"#ff784f",fillOpacity:1,weight:3}).addTo(shipmentMapInstance).bindPopup("<b>"+(stop.event_type==="blockage"?"ROAD BLOCKAGE": "VEHICLE STOPPED")+"</b><br>"+location+"<br>"+(stop.event_details||""));}catch{}}
}
const update=()=>{
if(Number.isFinite(Number(x.current_lat))&&x.current_lat!==null&&Number.isFinite(Number(x.current_lng))&&x.current_lng!==null){
const pos=[Number(x.current_lat),Number(x.current_lng)];marker.setLatLng(pos);
let nearest=0,best=Infinity;points.forEach((p,i)=>{const d=(p[0]-pos[0])**2+(p[1]-pos[1])**2;if(d<best){best=d;nearest=i;}});
travelled.setLatLngs(points.slice(0,nearest+1).concat([pos]));return;
}
const now=Date.now(),depart=new Date(x.departure_at).getTime(),arrive=new Date(x.arrival_at).getTime();
let p=now<depart?0:now>=arrive?1:Math.max(0,Math.min(1,(now-depart)/(arrive-depart)));
const resumed=events.some(e=>e.event_type==="resume"&&new Date(e.event_at)>new Date(stop?.event_at||0));
if(stop&&!resumed){p=Math.max(0,Math.min(1,(new Date(stop.event_at).getTime()-depart)/(arrive-depart)));if(stopPoint)marker.setLatLng(stopPoint);else marker.setLatLng(shipmentPointAt(points,p));}
else marker.setLatLng(shipmentPointAt(points,p));
const idx=Math.max(1,Math.floor(p*(points.length-1)));travelled.setLatLngs(points.slice(0,idx+1));
};
update();shipmentMapTimer=setInterval(update,1000);
if(routeDistance){const detail=document.querySelector(".shipment-route-distance");if(detail)detail.textContent=(routeDistance/1000).toFixed(0)+" km route";}
setTimeout(()=>shipmentMapInstance?.invalidateSize(),300);
}catch(error){host.innerHTML='<div class="shipment-map-error">The country map or direct route could not load. Check the selected country and city. <small>'+esc(error.message||"Map service unavailable")+'</small></div>';}
}
function renderPublicShipment(){document.title="Private shipment tracking";const slug=new URLSearchParams(location.search).get("shipment")||"";if(publicShipmentData){if(!shipmentRefreshTimer&&publicShipmentPassword){shipmentRefreshTimer=setInterval(async()=>{try{const response=await fetch(SUPABASE_URL+"/functions/v1/shipment-public",{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_ANON_KEY},body:JSON.stringify({action:"view",slug,password:publicShipmentPassword})});const data=await response.json();if(data.ok){publicShipmentData=data;const activeInput=document.activeElement?.closest("#shipment-viewer-message")?document.activeElement:null;const draft=activeInput?.value||"";const y=window.scrollY;const liveMapNode=app.querySelector("#shipment-live-map");app.innerHTML=renderPublicShipmentView(data);const nextMapHost=app.querySelector("#shipment-live-map");if(liveMapNode&&nextMapHost)nextMapHost.replaceWith(liveMapNode);initPublicShipmentMap(data);if(activeInput){const input=app.querySelector("#shipment-viewer-message input");if(input){input.value=draft;input.focus();}}window.scrollTo(0,y);}}catch{}} ,30000);}return renderPublicShipmentView(publicShipmentData);}return '<main class="public-shipment"><div class="public-shipment-brand"><b>Secure shipment tracking</b></div><section class="public-shipment-gate"><div class="shipment-intro-icon">📦</div><h1>View your shipment</h1><p>Enter the private tracking password shared by the sender.</p>'+(publicShipmentError?'<div class="notice">'+esc(publicShipmentError)+'</div>':'')+'<form id="shipment-access-form"><input type="hidden" name="slug" value="'+esc(slug)+'"><label>Tracking password<input name="password" type="password" autocomplete="current-password" required placeholder="Enter tracking password"></label><button class="primary-btn" type="submit">Open tracking page →</button></form><small>Private shipment journey page · independently operated preview</small></section></main>';}
function renderPublicShipmentView(data){
const x=data.shipment,now=Date.now(),start=new Date(x.departure_at).getTime(),end=new Date(x.arrival_at).getTime();
const progress=now<start?0:now>=end?100:Math.max(0,Math.min(99,Math.round((now-start)/(end-start)*100)));
const vehicle=x.transport_mode==="air"?"✈":x.transport_mode==="sea"?"🚢":"🚚";
const ordered=(data.events||[]).slice().sort((a,b)=>new Date(b.event_at)-new Date(a.event_at));
const operationalEvent=ordered.find(e=>["stop","blockage","delay"].includes(e.event_type));
const status=x.public_status_label||(operationalEvent?.event_type==="blockage"?"Route blocked":operationalEvent?.event_type==="stop"?"Stopped at checkpoint":operationalEvent?.event_type==="delay"?"Delayed":now<start?"Scheduled":now>=end?"Journey window completed":"In transit");
const messages=(data.messages||[]).map(m=>'<div class="shipment-chat-message '+(m.sender_role==="viewer"?"mine":"")+'"><b>'+esc(m.sender_name)+'</b><p>'+esc(m.message)+'</p><small>'+new Date(m.created_at).toLocaleString()+'</small></div>').join("");
const events=ordered.map(ev=>'<div class="public-event"><span class="public-event-dot"></span><div><b>'+esc(ev.event_title)+'</b><p>'+esc(ev.event_details||"")+'</p><small>'+new Date(ev.event_at).toLocaleString()+'</small></div></div>').join("");
const media=(data.media||[]).map(m=>m.url?(m.media_kind==="video"?'<video controls playsinline src="'+esc(m.url)+'"></video>':'<img src="'+esc(m.url)+'" alt="'+esc(m.file_name)+'">'):"").join("");
const incident=operationalEvent?'<div class="shipment-live-alert"><span class="shipment-alert-symbol">⚠</span><div><b>'+esc(operationalEvent.event_title)+'</b><small>'+esc(operationalEvent.event_details||"Journey update")+'</small></div><time>'+new Date(operationalEvent.event_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})+'</time></div>':"";
return '<main class="shipment-live-screen"><div id="shipment-live-map" class="shipment-live-map shipment-full-map" role="region" aria-label="Full-screen live shipment route map"></div><div class="shipment-map-top"><div class="shipment-map-brand"><span>'+vehicle+'</span><div><b>'+esc(x.operator_name||x.carrier)+'</b><small>'+esc(x.tracking_code)+'</small></div></div><span class="shipment-live-pill"><i></i>'+esc(status)+'</span></div><div class="shipment-map-route-caps"><span>FROM <b>'+esc(x.origin_city||x.origin)+'</b></span><span>TO <b>'+esc(x.destination_city||x.destination)+'</b></span></div>'+incident+'<section class="shipment-bottom-sheet"><div class="shipment-sheet-grabber"></div><div class="shipment-sheet-head"><div><small>SHIPMENT TRACKING</small><h1>'+esc(x.tracking_code)+'</h1><p>'+esc(x.sender_name)+' → '+esc(x.recipient_name)+'</p></div><div class="shipment-sheet-percent">'+progress+'%<small>scheduled</small></div></div><div class="shipment-sheet-progress"><i style="width:'+progress+'%"></i></div><div class="shipment-sheet-stops"><span><i></i><b>'+esc(x.origin_city||x.origin)+'</b><small>Departure</small></span><span><i></i><b>'+esc(x.destination_city||x.destination)+'</b><small>Destination</small></span></div><div class="shipment-sheet-times"><div><small>EXPECTED DELIVERY</small><b>'+esc(x.delivery_estimate||new Date(x.arrival_at).toLocaleString())+'</b></div><div><small>LAST UPDATE</small><b>'+esc(operationalEvent?new Date(operationalEvent.event_at).toLocaleString():"Tracking active")+'</b></div></div><div class="shipment-sheet-barcode">'+shipmentBarcode(x.barcode_value||x.tracking_code)+'</div><details class="shipment-sheet-details"><summary>Shipment contents, updates & messages</summary><h3>Shipment items</h3><p>'+esc(x.item_names)+'</p>'+(media?'<h3>Shipment media</h3><div class="public-media">'+media+'</div>':'')+'<h3>Journey history</h3><div class="public-events">'+events+'</div><h3>Messages</h3><div class="shipment-chat-log">'+(messages||'<p class="recent-empty">No messages yet.</p>')+'</div><form id="shipment-viewer-message" class="shipment-chat-form"><input name="message" maxlength="1000" required placeholder="Message the sender…"><button class="primary-btn" type="submit">Send</button></form></details></section></main>';
}
function renderAuth(){const phoneMode=authMode==="phone"||authMode==="phone-verify";app.innerHTML=`<div class="auth-screen"><div class="auth-card"><div class="brand auth-brand">${renderBrandMarkup()}</div><div class="eyebrow">YOUR CREATIVE SPACE STARTS HERE</div><h1>${authMode==="signup"?"Create your account":authMode==="phone-verify"?"Verify your phone":"Welcome back"}</h1><p class="auth-sub">${authMode==="signup"?"Join magic hour and keep your creative work in one place.":authMode==="phone-verify"?"Enter the one-time code sent to "+esc(pendingPhone):"Sign in to access your magic hour workspace."}</p>
${!phoneMode&&authMode==="login"?`<button class="social-auth google-auth" data-auth-google><span class="google-g">G</span> Continue with Google</button><button class="social-auth whatsapp-auth" data-auth-phone><span>${iconSvg("chat",19)}</span> Continue with WhatsApp</button><div class="auth-divider"><span>or use email</span></div>`:""}
<form id="auth-form" class="auth-form">${authMode==="signup"?`<label>Full name<input name="name" autocomplete="name" placeholder="Your name" required></label>`:""}
${phoneMode?(authMode==="phone-verify"?`<label>Verification code<input name="otp" inputmode="numeric" autocomplete="one-time-code" placeholder="6-digit code" minlength="6" maxlength="6" required></label>`:`<label>Phone number<input name="phone" type="tel" autocomplete="tel" placeholder="+2348012345678" required></label>`):`<label>Email address<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>${authMode==="phone"?"":`<label>Password<input name="password" type="password" autocomplete="${authMode==="login"?"current-password":"new-password"}" minlength="8" placeholder="At least 8 characters" required></label>`}`}
<button class="primary-btn auth-submit" type="submit">${authMode==="signup"?"Create account":authMode==="phone"?"Send WhatsApp code":authMode==="phone-verify"?"Verify and sign in":"Sign in"}</button></form>
${phoneMode?`<button class="text-btn auth-switch" data-auth-mode="login">Back to email sign in</button>`:`<button class="text-btn auth-switch" data-auth-mode="${authMode==="login"?"signup":"login"}">${authMode==="login"?"New to magic hour? Create an account":"Already have an account? Sign in"}</button>`}
${authMode==="login"?`<button class="text-btn auth-reset" data-auth-reset>Forgot password?</button>`:""}<p class="auth-message" role="status">${esc(authNotice)}</p><p class="auth-legal">By continuing, you agree to use magic hour responsibly.</p></div></div>`;const googleButton=app.querySelector("[data-auth-google]");if(googleButton){googleButton.addEventListener("click",async event=>{event.preventDefault();event.stopPropagation();googleButton.disabled=true;googleButton.textContent="Connecting to Google…";authNotice="";try{const {data,error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:"https://magichour-black.vercel.app",skipBrowserRedirect:true}});if(error)throw error;if(!data?.url)throw new Error("No Google authorization URL was returned. Confirm Google is enabled in Supabase Auth → Providers.");window.location.href=data.url;}catch(error){authNotice="Google sign-in failed: "+(error?.message||String(error));renderAuth();}});}}

loadWorldwideShipmentCountries();
function render(){if(new URLSearchParams(location.search).has("shipment")){app.innerHTML=renderPublicShipment();if(publicShipmentData)initPublicShipmentMap(publicShipmentData);return;}if(!currentUser){renderAuth();return;}if(!workspaceStateRestored)restoreWorkspaceState();const body=publicSiteConfig.settings?.maintenance_mode&&!isAdmin?renderMaintenance():activeTool?renderTool():page==="Home"?renderHome():page==="New chat"?renderChat():(page==="Admin dashboard"||page==="Site Control Centre")?renderAdminDashboard():renderGeneric();app.innerHTML=`
<div class="shell">
<header class="topbar"><button class="icon-btn" data-action="menu" aria-label="Toggle menu">${iconSvg("menu",19)}</button><div class="brand">${renderBrandMarkup()}</div><div class="top-spacer"></div><button class="install-app" id="install-app" hidden>Install app</button><button class="wallet" data-modal="wallet" aria-label="Coin wallet, ${walletBalance} coins${dailyClaimAvailable?", daily gift available":""}"><span class="coin">${iconSvg("coin",17)}</span><strong>${walletBalance.toLocaleString()}</strong>${dailyClaimAvailable?`<span class="daily-gift-indicator" title="Daily coins ready to claim">${iconSvg("gift",15)}</span>`:""}<span class="add-coin">+</span></button><button class="icon-btn notif" data-page="Notifications" aria-label="Notifications">${iconSvg("bell",18)}</button><button class="icon-btn account-btn" data-action="account" aria-label="Account">${iconSvg("user",19)}</button></header>
<div class="layout"><aside class="sidebar"><div class="side-label">Workspace</div>${sidebarLink("Home","home")}${sidebarLink("New chat","chat")}${sidebarLink("Library","library")}${sidebarLink("Projects","grid")}${sidebarLink("All tools","sparkles")}<div class="side-label">Account</div>${sidebarLink("Settings","settings")}${isAdmin?sidebarLink("Site Control Centre","shield-check"):""}<div class="side-bottom"><b>${iconSvg("crown",15)} &nbsp;magic hour Pro</b><p>More credits. More creative freedom. Faster workflows.</p><button class="upgrade-mini" data-modal="pro">Explore Pro</button></div></aside>
<main class="content">${body}</main></div>
<nav class="bottom-nav"><button class="${page==="Home"&&!activeTool?"active":""}" data-page="Home"><span>${iconSvg("home",18)}</span>Home</button><button class="${page==="Library"?"active":""}" data-page="Library"><span>${iconSvg("library",18)}</span>Library</button><button class="create-fab" data-page="Create" aria-label="Create">＋</button><button class="${page==="Projects"?"active":""}" data-page="Projects"><span>${iconSvg("grid",18)}</span>Projects</button><button class="${page==="Settings"?"active":""}" data-page="Settings"><span>${iconSvg("settings",18)}</span>Settings</button></nav>
</div>`;if(page==="Settings"&&!developerLoaded&&!developerLoading)loadDeveloperDashboard();if(activeTool==="social"&&pendingSocialSelection.length){app.querySelectorAll("input[data-social-item]").forEach(input=>{input.checked=pendingSocialSelection.includes(input.dataset.socialItem);});}persistWorkspaceState();}
function goPage(p){page=p;activeTool=null;render();window.scrollTo({top:0,behavior:"smooth"});persistWorkspaceState();}
function openTool(id){const feature=publicSiteConfig.features?.find(x=>x.tool_id===id);if(!isAdmin&&feature?.enabled===false){alert("This tool is currently unavailable.");return;}if(!isAdmin&&feature?.access_tier==="restricted"){alert("This tool is restricted by the site administrator.");return;}if(!isAdmin&&feature?.access_tier==="pro"&&!membershipInfo){showModal("pro");return;}activeTool=id;page="Home";selectedFile=null;selectedAssetFile=null;selectedReferenceFace=null;selectedTargetImage=null;workspaceResultUrl="";currentProjectId=null;workspaceNotice="";render();window.scrollTo({top:0,behavior:"smooth"});}
async function claimDailyCoins(){
 if(dailyCoinClaiming||!dailyClaimAvailable)return;
 dailyCoinClaiming=true;const claimButton=document.querySelector('.modal-backdrop [data-action="claim-daily-coins"]');if(claimButton){claimButton.disabled=true;claimButton.textContent="Claiming…";}dailyCoinMessage="";
 try{const {data,error}=await supabase.rpc("claim_daily_coins");if(error)throw error;if(!data?.ok)throw new Error(data?.error||"The daily reward could not be claimed.");walletBalance=Number(data.balance??walletBalance);dailyClaimAvailable=!data.claimed;dailyCoinMessage=data.claimed?"100 coins have been added to your wallet!":"You have already claimed today’s reward. Come back tomorrow.";await loadAccountData();}
 catch(error){dailyCoinMessage="Could not claim your daily coins: "+(error?.message||String(error));}
 finally{dailyCoinClaiming=false;document.querySelectorAll(".modal-backdrop").forEach(node=>node.remove());render();showModal("wallet");}
}
const membershipPlans=[
 {key:"gold",name:"Gold",price:"₦7,000",coins:"7,300",className:"gold",icon:"♛",features:["7,300 wallet coins included","One full year of membership","Gold member profile status","Access to supported premium features"]},
 {key:"diamond",name:"Diamond",price:"₦15,000",coins:"16,000",className:"diamond",icon:"❄",features:["16,000 wallet coins included","One full year of membership","Diamond member profile status","Priority access to supported premium features"]},
 {key:"platinum",name:"Platinum",price:"₦28,000",coins:"37,000",className:"platinum",icon:"✧",features:["37,000 wallet coins included","One full year of membership","Platinum member profile status","Premium generation access"]},
 {key:"platinum_unlimited",name:"Platinum Unlimited",price:"₦36,000",coins:"37,000",className:"unlimited",icon:"♾",features:["37,000 wallet coins included","One full year of membership","Unlimited generation entitlement","Unlimited video-duration entitlement"]}
];
async function beginPaystack(product,button){
 if(!currentUser){alert("Please sign in before purchasing.");return;}
 const old=button?.textContent;if(button){button.disabled=true;button.textContent="Opening secure checkout…";}
 try{
  const {data,error}=await supabase.functions.invoke("paystack-membership",{body:{action:"initialize",product}});
  if(error)throw error;if(!data?.authorization_url)throw new Error(data?.error||"Checkout could not be started.");
  window.location.assign(data.authorization_url);
 }catch(error){alert("Checkout failed: "+(error?.message||String(error)));if(button){button.disabled=false;button.textContent=old||"Continue";}}
}
async function verifyReturnedPayment(){
 const params=new URLSearchParams(location.search);if(params.get("payment")!=="complete")return;
 const reference=params.get("reference");history.replaceState({},document.title,location.pathname+location.hash);
 if(!reference)return;
 try{
  const {data,error}=await supabase.functions.invoke("paystack-membership",{body:{action:"verify",reference}});
  if(error)throw error;if(!data?.ok)throw new Error(data?.message||data?.error||"Payment has not been confirmed.");
  await loadAccountData();alert("Payment confirmed! Your coins and membership have been activated.");showModal("pro");
 }catch(error){alert("We couldn't confirm this payment yet: "+(error?.message||String(error))+". Your payment is not credited until Paystack confirms it.");}
}
function showModal(type){
 const node=document.createElement("div");node.className="modal-backdrop";
 const rows=walletTransactions.length?walletTransactions.map(t=>`<div class="account-panel"><b>${esc(t.transaction_type)} · ${Number(t.amount).toLocaleString()} coins</b><p>${esc(t.description||"Wallet activity")} · ${new Date(t.created_at).toLocaleString()}</p></div>`).join(""):'<p>No wallet transactions yet.</p>';
 const packages=[{key:"coin_500",price:"₦500",coins:"500"},{key:"coin_1100",price:"₦1,000",coins:"1,100"},{key:"coin_2400",price:"₦2,000",coins:"2,400"}];
 const active=membershipInfo?'<div class="membership-active"><span>ACTIVE MEMBERSHIP</span><b>'+esc(membershipInfo.plan_name)+'</b><small>Expires '+new Date(membershipInfo.expires_at).toLocaleDateString()+'</small><small>'+Math.max(0,Math.ceil((new Date(membershipInfo.expires_at)-Date.now())/86400000))+' days remaining</small></div>':'<div class="membership-inactive">No active membership · Choose your annual plan below</div>';
 const cards=membershipPlans.map(p=>`<article class="membership-card ${p.className}"><div class="membership-card-glow"></div><div class="membership-card-top"><span class="membership-emblem">${p.icon}</span><span class="membership-year">365 DAYS</span></div><h3>${p.name}</h3><div class="membership-price">${p.price}<small>/ year</small></div><div class="membership-coins">＋ ${p.coins} coins included</div><ul>${p.features.map(f=>`<li><i>✓</i>${f}</li>`).join("")}</ul><button class="membership-buy" data-buy="${p.key}">Choose ${p.name}</button></article>`).join("");
 const body=type==="wallet"?`<div class="membership-modal-head"><span class="membership-kicker">MAGIC HOUR WALLET</span><h2>Coin wallet</h2><p>Balance <b>${walletBalance.toLocaleString()} coins</b></p></div><div class="daily-claim-card"><div class="daily-claim-icon">${iconSvg("gift",24)}</div><div class="daily-claim-copy"><b>${dailyClaimAvailable?"Your daily gift is ready!":"Daily reward claimed"}</b><p>${dailyClaimAvailable?"Claim 100 free coins today. Come back tomorrow for your next reward.":"Your next 100-coin reward will be available tomorrow."}</p></div><button class="daily-claim-btn" data-action="claim-daily-coins" ${dailyClaimAvailable&&!dailyCoinClaiming?"":"disabled"}>${dailyCoinClaiming?"Claiming…":dailyClaimAvailable?"Claim 100 coins":"Claimed"}</button></div>${dailyCoinMessage?`<p class="notice">${esc(dailyCoinMessage)}</p>`:""}<h3 class="wallet-subtitle">Buy coins</h3><div class="coin-packages">${packages.map(p=>`<button class="coin-package" data-buy="${p.key}"><b>${p.coins}</b><span>coins</span><strong>${p.price}</strong></button>`).join("")}</div><h3 class="wallet-subtitle">Recent activity</h3><div class="account-list">${rows}</div>`:`<div class="membership-modal-head"><span class="membership-kicker">THE MAGIC HOUR MEMBERS CLUB</span><h2>Choose your level<span>✦</span></h2><p>Premium membership, wallet coins and a full year of access.</p></div>${active}<div class="membership-carousel">${cards}</div><p class="membership-footnote">Secure checkout powered by Paystack · Membership activates only after payment verification.</p>`;
 node.innerHTML=`<div class="modal membership-dialog" role="dialog" aria-modal="true">${body}<div class="modal-actions"><button class="secondary-btn" data-close>Close</button></div></div>`;
 node.addEventListener("click",e=>{const buy=e.target.closest("[data-buy]");if(buy){beginPaystack(buy.dataset.buy,buy);return;}if(e.target.closest('[data-action="claim-daily-coins"]')){claimDailyCoins();return;}if(e.target===node||e.target.closest("[data-close]"))node.remove();});document.body.append(node);
}
function workspaceStorageKey(){return currentUser?"musky-workspace:"+currentUser.id:null;}
function persistWorkspaceState(){const key=workspaceStorageKey();if(!key)return;try{pendingSocialSelection=[...app.querySelectorAll("input[data-social-item]:checked")].map(input=>input.dataset.socialItem);localStorage.setItem(key,JSON.stringify({page,activeTool,scrollY:window.scrollY||0,videoDurationSeconds,videoAspectRatio,videoPromptText,currentProjectId,pendingSocialSelection}));}catch(error){console.warn("Workspace state could not be saved:",error);}}
function restoreWorkspaceState(){if(workspaceStateRestored)return;workspaceStateRestored=true;const key=workspaceStorageKey();if(!key)return;try{const saved=JSON.parse(localStorage.getItem(key)||"null");if(!saved)return;const validPages=["Home","New chat","Library","Projects","Settings","All tools","Create","Notifications"];page=validPages.includes(saved.page)?saved.page:"Home";activeTool=saved.activeTool&&(tools.some(t=>t.id===saved.activeTool)||["ai-video","image-to-video","background-remover"].includes(saved.activeTool))?saved.activeTool:null;videoDurationSeconds=[5,10].includes(Number(saved.videoDurationSeconds))?Number(saved.videoDurationSeconds):5;videoAspectRatio=["16:9","9:16","1:1"].includes(saved.videoAspectRatio)?saved.videoAspectRatio:"16:9";videoPromptText=typeof saved.videoPromptText==="string"?saved.videoPromptText.slice(0,1200):"";currentProjectId=typeof saved.currentProjectId==="string"?saved.currentProjectId:null;pendingSocialSelection=Array.isArray(saved.pendingSocialSelection)?saved.pendingSocialSelection.filter(x=>typeof x==="string"):[];const y=Math.max(0,Math.min(Number(saved.scrollY)||0,100000));requestAnimationFrame(()=>window.scrollTo(0,y));}catch(error){console.warn("Saved workspace state could not be restored:",error);}}
window.addEventListener("pagehide",persistWorkspaceState);
let workspaceSaveTimer=null;window.addEventListener("scroll",()=>{clearTimeout(workspaceSaveTimer);workspaceSaveTimer=setTimeout(persistWorkspaceState,250);},{passive:true});
function sendMessage(text){const value=text.trim();if(!value)return;messages.push({role:"user",text:value});messages.push({role:"assistant",text:"I’ve got your request. Live AI replies will be available when the chat model is connected. You can open one of the tool workspaces from Home in the meantime."});page="New chat";activeTool=null;render();}
app.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;
if(b.hasAttribute("data-campaign-dismiss")){app.querySelector(".campaign-welcome-overlay")?.remove();return;}
if(b.dataset.adminRoom){activeAdminRoom=b.dataset.adminRoom;if(activeAdminRoom==="Overview")loadAdminDashboard(true);else if(activeAdminRoom==="Campaigns")loadAdminCampaigns();else loadAdminRoom(activeAdminRoom);return;}
if(b.hasAttribute("data-campaign-cancel-edit")){editingCampaign=null;render();return;}
if(b.dataset.adminDeleteAsset){if(!confirm("Permanently delete this uploaded file? Any campaign using it may stop displaying."))return;b.disabled=true;try{const asset=userAssets.find(x=>x.id===b.dataset.adminDeleteAsset);if(!asset||!asset.storage_path?.startsWith((currentUser?.id||"")+"/site-media/"))throw new Error("This file is not part of the Site Uploads library.");const {data:campaignRefs,error:campaignCheckError}=await supabase.from("mh_site_campaigns").select("id,title").eq("asset_id",asset.id).limit(1);if(campaignCheckError)throw campaignCheckError;if(campaignRefs?.length)throw new Error("This file is attached to the campaign “"+campaignRefs[0].title+"”. Remove or replace that campaign media before deleting this file.");const {error:storageError}=await supabase.storage.from("magic-hour-assets").remove([asset.storage_path]);if(storageError)throw storageError;const {error:rowError}=await supabase.from("mh_assets").delete().eq("id",asset.id).eq("user_id",currentUser.id);if(rowError)throw rowError;adminUploadNotice="File deleted from private storage.";await loadAccountData();}catch(error){adminUploadNotice="Delete failed: "+(error.message||String(error));render();}return;}
if(b.dataset.campaignRefresh!==undefined){await loadAdminCampaigns();return;}
if(b.dataset.campaignEdit){editingCampaign=adminCampaigns.find(c=>c.id===b.dataset.campaignEdit)||null;render();return;}
if(b.dataset.campaignStatus){b.disabled=true;try{await campaignServiceRequest("set_status",{id:b.dataset.campaignStatus,status:b.dataset.status});adminCampaignNotice="Campaign status updated.";await loadAdminCampaigns();await loadPublicCampaigns();}catch(error){adminCampaignNotice="Campaign update failed: "+(error?.message||String(error));render();}return;}
if(b.dataset.campaignDelete){if(!confirm("Delete this campaign? Its uploaded file will remain in Site Uploads."))return;try{await campaignServiceRequest("delete",{id:b.dataset.campaignDelete});adminCampaignNotice="Campaign deleted. Uploaded media was kept.";await loadAdminCampaigns();await loadPublicCampaigns();}catch(error){adminCampaignNotice="Campaign deletion failed: "+(error?.message||String(error));render();}return;}
if(b.hasAttribute("data-admin-room-refresh")){await loadAdminRoom();return;}
if(b.dataset.experimentToggle){try{await adminConsoleRequest("toggle_experiment",{id:b.dataset.experimentToggle,enabled:b.dataset.enabled==="true"});adminRoomNotice="Experiment status updated.";await loadAdminRoom("Feature Experiments");}catch(error){adminRoomNotice=error.message||String(error);render();}return;}
if(b.dataset.apiRevoke){if(!confirm("Revoke this API key immediately? Any integration using it will stop working."))return;try{await adminConsoleRequest("revoke_api_key",{id:b.dataset.apiRevoke});adminRoomNotice="API key revoked.";await loadAdminRoom("API Centre");}catch(error){adminRoomNotice=error.message||String(error);render();}return;}
if(b.dataset.announcementDelete){if(!confirm("Permanently delete this announcement?"))return;try{await adminConsoleRequest("delete_announcement",{id:b.dataset.announcementDelete});adminRoomNotice="Announcement deleted.";await loadPublicSiteConfig();await loadAdminRoom("Announcements");}catch(error){adminRoomNotice=error.message||String(error);render();}return;}
if(b.dataset.announcementToggle){try{await adminConsoleRequest("update_announcement",{id:b.dataset.announcementToggle,active:b.dataset.active==="true"});adminRoomNotice="Announcement status updated.";await loadPublicSiteConfig();await loadAdminRoom(activeAdminRoom==="Notifications"?"Notifications":"Announcements");}catch(error){adminRoomNotice=error.message||String(error);render();}return;}
if(b.dataset.experimentToggle){try{await adminConsoleRequest("toggle_experiment",{id:b.dataset.experimentToggle,enabled:b.dataset.enabled==="true"});adminRoomNotice="Experiment status updated.";await loadAdminRoom("Feature Experiments");}catch(error){adminRoomNotice=error.message||String(error);render();}return;}
if(b.dataset.adminRoomRefresh!==undefined){await loadAdminRoom();return;}
if(b.dataset.adminRefresh!==undefined){await loadAdminDashboard(true);return;}
if(b.dataset.adminIssueStatus){b.disabled=true;try{await adminConsoleRequest("update_issue",{id:b.dataset.adminIssueStatus,status:b.dataset.status});await loadAdminDashboard(true);}catch(error){alert("Could not update issue: "+(error.message||error));b.disabled=false;}return;}
if(b.dataset.adminScroll){const target=b.dataset.adminScroll==="users"?".admin-table-wrap":b.dataset.adminScroll==="issues"?".admin-issue-form":".admin-fail-list";app.querySelector(target)?.scrollIntoView({behavior:"smooth",block:"start"});return;}

if(b.dataset.apiRefresh!==undefined){developerLoaded=false;await loadDeveloperDashboard(true);return;}
if(b.dataset.apiCreate!==undefined){
 const name=document.querySelector("#api-key-name")?.value?.trim()||"Default API key";
 b.disabled=true;b.textContent="Creating…";
 try{const data=await developerApiRequest("/keys/create","POST",{name});developerNewKey=data.key||"";developerLoaded=false;await loadDeveloperDashboard(true);}
 catch(error){developerError=error?.message||String(error);render();}
 return;
}
if(b.dataset.apiRevoke){
 if(!confirm("Revoke this API key? Any website using it will immediately lose access."))return;
 b.disabled=true;b.textContent="Revoking…";
 try{await developerApiRequest("/keys/revoke","POST",{id:b.dataset.apiRevoke});developerLoaded=false;await loadDeveloperDashboard(true);}
 catch(error){developerError=error?.message||String(error);render();}
 return;
}
if(b.dataset.apiCopy!==undefined){if(!developerNewKey)return;try{await navigator.clipboard.writeText(developerNewKey);b.textContent="Copied!";}catch{alert("Copy was blocked by your browser. Select and copy the key manually.");}return;}
if(b.dataset.apiCopyBase!==undefined){try{await navigator.clipboard.writeText(SUPABASE_URL+"/functions/v1/developer-api");b.textContent="Copied!";}catch{alert("Copy was blocked by your browser.");}return;}
if(b.dataset.shipmentRefreshChat){await loadShipmentOwnerMessages();render();return;}
if(b.dataset.shipmentOpen){const {data,error}=await supabase.from("ms_shipments").select("id,tracking_code,tracking_slug,carrier,transport_mode,sender_name,recipient_name,origin,destination,origin_country,origin_city,destination_country,destination_city,operator_name,current_location,current_lat,current_lng,public_status_label,delivery_estimate,item_names,departure_at,arrival_at,status,is_obstructed,obstruction_reason,obstruction_location,obstructed_at,progress_percent,paused_progress,paused_duration_seconds").eq("id",b.dataset.shipmentOpen).eq("user_id",currentUser.id).single();if(error){alert("Could not open shipment: "+error.message);return;}shipmentCreated={...data,url:"https://muskyp2v-ai-studio-tracking-site.vercel.app/?shipment="+data.tracking_slug,password:""};await loadShipmentOwnerMessages();render();return;}
if(b.dataset.shipmentNewPassword){const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";const password=Array.from(crypto.getRandomValues(new Uint8Array(10))).map(x=>alphabet[x%alphabet.length]).join("");const salt=crypto.randomUUID();const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(salt+":"+password));const hash=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");const {error}=await supabase.from("ms_shipments").update({access_password_hash:salt+":"+hash,updated_at:new Date().toISOString()}).eq("id",shipmentCreated.id).eq("user_id",currentUser.id);if(error){alert("Could not update password: "+error.message);return;}shipmentCreated.password=password;shipmentNotice="New tracking password created. Copy it and share it privately.";render();return;}
if(b.dataset.shipmentCopy){const value=b.dataset.shipmentCopy==="url"?shipmentCreated?.url:shipmentCreated?.password;if(value){try{await navigator.clipboard.writeText(value);b.textContent="Copied";}catch{alert("Select and copy the value manually.");}}return;}
if(b.dataset.socialBook!==undefined){const ci=Number(b.dataset.socialBook);const group=socialCatalog[ci];if(!group)return;const chosen=[...app.querySelectorAll('input[data-social-item="'+ci+'"]:checked')].map(x=>x.value);const list=chosen.length?chosen.join(", "):"Please send me the available options for "+group.category;const msg="Hello Magic Hour! I want to book from: "+group.category+".\nServices: "+list+".\nPlease share current stock, account/service age, username/password handover details and 2FA status before payment.";window.open("https://wa.me/2349041259863?text="+encodeURIComponent(msg),"_blank","noopener");return;}
if(b.dataset.socialJump!==undefined){document.getElementById("social-category-"+b.dataset.socialJump)?.scrollIntoView({behavior:"smooth",block:"start"});return;}

if(b.dataset.dismissRecent){dismissedRecentAssetIds.add(b.dataset.dismissRecent);render();return;}
if(b.dataset.recentFace||b.dataset.recentTarget){const assetId=b.dataset.recentFace||b.dataset.recentTarget;const asset=userAssets.find(a=>a.id===assetId);if(!asset)return;if(b.dataset.recentFace){selectedReferenceAssetId=assetId;selectedReferenceFace=null;if(referencePreviewUrl)URL.revokeObjectURL(referencePreviewUrl);referencePreviewUrl=asset.signedUrl||"";workspaceNotice="Recent face image selected.";}else{selectedTargetAssetId=assetId;selectedTargetImage=null;if(targetPreviewUrl)URL.revokeObjectURL(targetPreviewUrl);targetPreviewUrl=asset.signedUrl||"";workspaceNotice="Recent target image selected.";}render();return;}if(b.dataset.authMode){authMode=b.dataset.authMode;authNotice="";renderAuth();return;}if(b.dataset.authGoogle){const googleButton=b;googleButton.disabled=true;googleButton.textContent="Connecting to Google…";(async()=>{try{const {data,error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:"https://magichour-black.vercel.app",skipBrowserRedirect:true}});if(error)throw error;if(!data?.url)throw new Error("Supabase did not return a Google authorization URL. Check that Google is enabled in Supabase Auth providers.");window.location.assign(data.url);}catch(error){authNotice="Google sign-in could not start: "+(error?.message||"Unknown error");renderAuth();}})();return;}if(b.dataset.authPhone){authMode="phone";authNotice="Use your full international phone number. WhatsApp delivery requires the WhatsApp messaging provider to be configured.";renderAuth();return;}if(b.dataset.authReset){const email=app.querySelector('input[name="email"]')?.value?.trim();if(!email){authNotice="Enter your email address first.";renderAuth();return;}supabase.auth.resetPasswordForEmail(email,{redirectTo:"https://magichour-black.vercel.app"}).then(({error})=>{authNotice=error?error.message:"Password reset instructions have been sent if this email is registered.";renderAuth();});return;}if(b.dataset.action==="account"){goPage("Settings");return;}if(b.dataset.action==="signout"){supabase.auth.signOut();return;}if(b.dataset.page){goPage(b.dataset.page);return;}if(b.dataset.tool){openTool(b.dataset.tool);return;}if(b.dataset.project){const p=userProjects.find(x=>x.id===b.dataset.project);if(p){activeTool=p.tool_id;page="Home";currentProjectId=p.id;workspaceNotice="Project opened. Upload a file to add it to this project.";render();}return;}if(b.dataset.action==="download-result"||b.dataset.action==="share-result"){
 const mode=b.dataset.action==="download-result"?"download":"share";const url=workspaceResultUrl;
 if(!url){alert("The generated image is not available.");return;}
 try{const response=await fetch(url);if(!response.ok)throw new Error("Could not retrieve the generated image.");const blob=await response.blob();const file=new File([blob],"musky-headswap-result.png",{type:blob.type||"image/png"});
 if(mode==="download"){const objectUrl=URL.createObjectURL(blob);const link=document.createElement("a");link.href=objectUrl;link.download="musky-headswap-result.png";document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),1500);}
 else if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:"My HeadSwap result",text:"Created with Magic Hour AI Studio"});}
 else if(navigator.share){await navigator.share({title:"My HeadSwap result",text:"My HeadSwap result",url});}
 else{await navigator.clipboard.writeText(url);alert("Share link copied. You can paste it into WhatsApp, Zangi or another app.");}
 }catch(error){if(error?.name!=="AbortError")alert((mode==="download"?"Download":"Share")+" failed: "+(error?.message||String(error)));}
 return;
}
if(b.dataset.deleteAsset){const asset=userAssets.find(a=>a.id===b.dataset.deleteAsset);if(!asset)return;if(!confirm(`Delete "${asset.file_name}" from your history and private library? This cannot be undone.`))return;b.disabled=true;b.textContent="Deleting…";try{const {error:storageError}=await supabase.storage.from("magic-hour-assets").remove([asset.storage_path]);if(storageError)throw storageError;const {error:rowError}=await supabase.from("mh_assets").delete().eq("id",asset.id).eq("user_id",currentUser.id);if(rowError)throw rowError;if(selectedReferenceAssetId===asset.id){selectedReferenceAssetId="";referencePreviewUrl="";}if(selectedTargetAssetId===asset.id){selectedTargetAssetId="";targetPreviewUrl="";}await loadAccountData();}catch(error){alert("Could not delete this image: "+(error?.message||String(error)));b.disabled=false;b.textContent="Delete";}return;}
if(b.dataset.preview){const url=b.dataset.preview;const viewer=document.createElement("div");viewer.className="image-lightbox";viewer.innerHTML='<button class="lightbox-close" aria-label="Close">×</button><img alt="Preview">';viewer.querySelector("img").src=url;viewer.addEventListener("click",event=>{if(event.target===viewer||event.target.closest(".lightbox-close"))viewer.remove();});document.body.appendChild(viewer);return;}
if(b.dataset.asset){const a=userAssets.find(x=>x.id===b.dataset.asset);if(a){supabase.storage.from("magic-hour-assets").createSignedUrl(a.storage_path,3600).then(({data,error})=>{if(error){alert("Could not open file: "+error.message);return;}window.open(data.signedUrl,"_blank","noopener");});}return;}if(b.dataset.extra){openTool(b.dataset.extra.toLowerCase().replace(/[^a-z0-9]+/g,"-"));return;}if(b.dataset.modal){showModal(b.dataset.modal);return;}if(b.dataset.action==="back"){activeTool=null;page="Home";videoDiagnosticResult=null;piapiDiagnosticResult=null;shipmentCreated=null;shipmentNotice="";render();return;}if(b.dataset.action==="run-ai-video"){
 if(!selectedVideoFile){workspaceNotice="Choose an image first.";render();return;}
 const prompt=document.querySelector("#video-prompt")?.value?.trim()||"";
 if(!prompt){workspaceNotice="Describe the movement you want in your video.";render();return;}
 if(!["image/jpeg","image/png","image/webp"].includes(selectedVideoFile.type)){workspaceNotice="Use a JPG, PNG or WebP image.";render();return;}
 if(selectedVideoFile.size>12*1024*1024){workspaceNotice="This image is larger than 12 MB. Please choose a smaller image.";render();return;}
 const cost=videoDurationSeconds*10;
 if(dailyVideoCredits<cost){workspaceNotice="You do not have enough daily video credits for this duration.";render();return;}
 workspaceBusy=true;workspaceResultUrl="";workspaceNotice="Creating your project and uploading the source image…";render();
 try{
  const {data:project,error:projectError}=await supabase.from("mh_projects").insert({user_id:currentUser.id,title:"AI Video "+new Date().toLocaleString(),tool_id:activeTool,status:"processing",metadata:{provider:"piapi",model:"kling-1.6"}}).select("id").single();
  if(projectError)throw projectError;
  currentProjectId=project.id;
  const safeName=selectedVideoFile.name.replace(/[^a-zA-Z0-9._-]/g,"_");
  const path=currentUser.id+"/"+project.id+"/"+Date.now()+"-video-source-"+safeName;
  const {error:uploadError}=await supabase.storage.from("magic-hour-assets").upload(path,selectedVideoFile,{contentType:selectedVideoFile.type,upsert:false});
  if(uploadError)throw uploadError;
  const {error:assetError}=await supabase.from("mh_assets").insert({user_id:currentUser.id,project_id:project.id,storage_path:path,file_name:selectedVideoFile.name,mime_type:selectedVideoFile.type,size_bytes:selectedVideoFile.size});
  if(assetError){await supabase.storage.from("magic-hour-assets").remove([path]);throw assetError;}
  workspaceNotice="Submitting your video request to PiAPI…";render();
  const {data,error}=await supabase.functions.invoke("piapi-video",{body:{action:"start",storagePath:path,projectId:project.id,prompt,durationSeconds:videoDurationSeconds,aspectRatio:videoAspectRatio}});
  if(error)throw error;
  if(!data?.ok)throw new Error(data?.error||"PiAPI could not start this video.");
  dailyVideoCredits=Number(data.creditsRemaining??Math.max(0,dailyVideoCredits-cost));
  selectedVideoFile=null;videoPromptText="";if(videoPreviewUrl)URL.revokeObjectURL(videoPreviewUrl);videoPreviewUrl="";
  activeVideoJobId=data.jobId;videoPollingToken++;
  workspaceNotice="Video submitted. PiAPI is generating it now…";workspaceBusy=false;await loadAccountData();render();
  pollPiapiVideo(data.jobId,videoPollingToken,0);
 }catch(error){workspaceNotice="Video request failed: "+(error?.message||String(error));workspaceBusy=false;await loadAccountData();render();}
 return;
}
if(b.dataset.action==="check-piapi-access"){
  workspaceBusy=true;workspaceNotice="Checking PiAPI securely…";piapiDiagnosticResult=null;render();
  try{
   const {data,error}=await supabase.functions.invoke("piapi-video-diagnostics",{body:{}});
   if(error)throw error;
   piapiDiagnosticResult=data||{ok:false,connected:false,error:"PiAPI returned an empty response."};
   workspaceNotice=piapiDiagnosticResult.connected?"PiAPI connection verified. No video was generated.":(piapiDiagnosticResult.error||"PiAPI connection could not be verified.");
  }catch(error){piapiDiagnosticResult={ok:false,connected:false,error:error?.message||String(error)};workspaceNotice="PiAPI check failed: "+piapiDiagnosticResult.error;}
  finally{workspaceBusy=false;render();}
  return;
 }
 if(b.dataset.action==="menu"){document.querySelector(".sidebar")?.classList.toggle("show-mobile");const s=document.querySelector(".sidebar");if(s){s.style.display=s.style.display==="block"?"none":"block";s.style.position="fixed";s.style.zIndex="30";s.style.top="64px";s.style.bottom="70px";s.style.left="0";s.style.width="245px";s.style.background="#080e17";s.style.boxShadow="10px 0 35px #0009";}return;}if(b.dataset.action==="run-background"){
 if(!selectedAssetFile){workspaceNotice="Choose an image first.";render();return;}
 const allowed=["image/jpeg","image/png","image/webp"];
 if(!allowed.includes(selectedAssetFile.type)){workspaceNotice="Use a JPG, PNG or WebP image.";render();return;}
 if(selectedAssetFile.size>12*1024*1024){workspaceNotice="This image is larger than 12 MB. Please choose a smaller image.";render();return;}
 workspaceBusy=true;workspaceResultUrl="";workspaceNotice="Uploading your image securely…";render();
 let uploadedPath="";
 try{
  let projectId=currentProjectId;
  if(!projectId){
   const {data:project,error:projectError}=await supabase.from("mh_projects").insert({user_id:currentUser.id,title:"Background Removal "+new Date().toLocaleString(),tool_id:"background-remover",status:"processing",metadata:{provider:"remove.bg"}}).select("id").single();
   if(projectError)throw projectError;
   projectId=project.id;currentProjectId=projectId;
  }else{
   const {error:projectError}=await supabase.from("mh_projects").update({status:"processing",updated_at:new Date().toISOString()}).eq("id",projectId).eq("user_id",currentUser.id);
   if(projectError)throw projectError;
  }
  const safeName=selectedAssetFile.name.replace(/[^a-zA-Z0-9._-]/g,"_");
  uploadedPath=currentUser.id+"/"+projectId+"/"+Date.now()+"-original-"+safeName;
  const {error:uploadError}=await supabase.storage.from("magic-hour-assets").upload(uploadedPath,selectedAssetFile,{contentType:selectedAssetFile.type,upsert:false});
  if(uploadError)throw uploadError;
  const {error:assetError}=await supabase.from("mh_assets").insert({user_id:currentUser.id,project_id:projectId,storage_path:uploadedPath,file_name:selectedAssetFile.name,mime_type:selectedAssetFile.type,size_bytes:selectedAssetFile.size});
  if(assetError){await supabase.storage.from("magic-hour-assets").remove([uploadedPath]);throw assetError;}
  workspaceNotice="Removing the background with remove.bg…";render();
  const {data,error}=await supabase.functions.invoke("remove-background",{body:{storagePath:uploadedPath,projectId}});
  if(error)throw error;
  if(!data?.ok)throw new Error(data?.error||"The background-removal service did not return a result.");
  workspaceResultUrl=data.signedUrl||"";
  if(!workspaceResultUrl&&data.asset?.storage_path){
   const {data:signed,error:signedError}=await supabase.storage.from("magic-hour-assets").createSignedUrl(data.asset.storage_path,3600);
   if(signedError)throw signedError;
   workspaceResultUrl=signed?.signedUrl||"";
  }
  if(!workspaceResultUrl)throw new Error("The result was saved but could not be opened. Check your Library.");
  selectedAssetFile=null;selectedFile=null;workspaceNotice="Background removed! Your transparent PNG is saved in your private Library.";
  await loadAccountData();
 }catch(error){
  workspaceNotice="Background removal failed: "+(error?.message||String(error));
  if(currentProjectId)await supabase.from("mh_projects").update({status:"failed",updated_at:new Date().toISOString()}).eq("id",currentProjectId).eq("user_id",currentUser.id);
  await loadAccountData();
 }finally{workspaceBusy=false;render();}
 return;
}
if(b.dataset.action==="run-headswap"){
 if((!selectedReferenceFace&&!selectedReferenceAssetId)||(!selectedTargetImage&&!selectedTargetAssetId)){workspaceNotice="Choose a face image and a body image, either by uploading or selecting recent images.";render();return;}
 if(!currentUser){workspaceNotice="Please sign in again.";render();return;}
 const allowed=["image/jpeg","image/png","image/webp"];
 if(selectedReferenceFace&&!allowed.includes(selectedReferenceFace.type)||selectedTargetImage&&!allowed.includes(selectedTargetImage.type)){workspaceNotice="Use JPG, PNG or WebP images.";render();return;}
 if(selectedReferenceFace?.size>100*1024*1024||selectedTargetImage?.size>100*1024*1024){workspaceNotice="Each image must be smaller than 100 MB.";render();return;}
 workspaceBusy=true;workspaceResultUrl="";workspaceNotice="Uploading your images securely…";render();
 let uploadedPaths=[];
 try{
  let projectId=currentProjectId;
  if(!projectId){
   const {data:project,error:projectError}=await supabase.from("mh_projects").insert({user_id:currentUser.id,title:"Face Swap "+new Date().toLocaleString(),tool_id:"headswap",status:"processing",metadata:{provider:"bfs-best-face-swap"}}).select("id").single();
   if(projectError)throw projectError;
   projectId=project.id;currentProjectId=projectId;
  }else{
   const {error:projectError}=await supabase.from("mh_projects").update({status:"processing",updated_at:new Date().toISOString()}).eq("id",projectId).eq("user_id",currentUser.id);
   if(projectError)throw projectError;
  }
  const uploadOne=async(file,role)=>{
   const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
   const path=currentUser.id+"/"+projectId+"/"+Date.now()+"-"+role+"-"+safeName;
   const {error:uploadError}=await supabase.storage.from("magic-hour-assets").upload(path,file,{contentType:file.type,upsert:false});
   if(uploadError)throw uploadError;
   uploadedPaths.push(path);
   const {error:assetError}=await supabase.from("mh_assets").insert({user_id:currentUser.id,project_id:projectId,storage_path:path,file_name:file.name,mime_type:file.type,size_bytes:file.size});
   if(assetError)throw assetError;
   return path;
  };
  workspaceNotice="Sending images to the BFS face-swap engine…";render();
  const recentAssetPath=assetId=>{const asset=userAssets.find(a=>a.id===assetId);if(!asset)throw new Error("A selected recent image is no longer available. Please choose it again.");return asset.storage_path;};
  const referencePath=selectedReferenceFace?await uploadOne(selectedReferenceFace,"reference-face"):recentAssetPath(selectedReferenceAssetId);
  const targetPath=selectedTargetImage?await uploadOne(selectedTargetImage,"target-photo"):recentAssetPath(selectedTargetAssetId);
  const {data,error}=await supabase.functions.invoke("bfs-face-swap",{body:{referencePath,targetPath,projectId}});
  if(error)throw error;
  if(!data?.ok)throw new Error(data?.error||"The face-swap provider did not return a result.");
  workspaceResultUrl=data.signedUrl||"";
  if(!workspaceResultUrl&&data.asset?.storage_path){
   const {data:signed,error:signedError}=await supabase.storage.from("magic-hour-assets").createSignedUrl(data.asset.storage_path,3600);
   if(signedError)throw signedError;
   workspaceResultUrl=signed?.signedUrl||"";
  }
  selectedReferenceFace=null;selectedTargetImage=null;selectedReferenceAssetId="";selectedTargetAssetId="";if(referencePreviewUrl)URL.revokeObjectURL(referencePreviewUrl);if(targetPreviewUrl)URL.revokeObjectURL(targetPreviewUrl);referencePreviewUrl="";targetPreviewUrl="";
  workspaceNotice="Face swap completed. Your result has been saved to your private Library.";
  await loadAccountData();
 }catch(error){
  workspaceNotice="Face swap failed: "+(error?.message||String(error));
  if(currentProjectId)await supabase.from("mh_projects").update({status:"failed",updated_at:new Date().toISOString()}).eq("id",currentProjectId).eq("user_id",currentUser.id);
  await loadAccountData();
 }finally{workspaceBusy=false;render();}
 return;
}
if(b.dataset.action==="prepare"){
 if(!selectedAssetFile){workspaceNotice="Choose a file first.";render();return;}
 if(!currentUser){workspaceNotice="Please sign in again.";render();return;}
 if(selectedAssetFile.size>100*1024*1024){workspaceNotice="File exceeds the 100 MB storage limit.";render();return;}
 workspaceBusy=true;workspaceNotice="Creating project and uploading securely…";render();
 try{
  const safeName=selectedAssetFile.name.replace(/[^a-zA-Z0-9._-]/g,"_");
  let projectId=currentProjectId;
  if(!projectId){
   const {data:project,error:projectError}=await supabase.from("mh_projects").insert({user_id:currentUser.id,title:safeName.replace(/\.[^.]+$/,""),tool_id:activeTool||"general",status:"draft",metadata:{source:"web-app"}}).select("id").single();
   if(projectError)throw projectError;
   projectId=project.id;currentProjectId=projectId;
  }
  const storagePath=currentUser.id+"/"+projectId+"/"+Date.now()+"-"+safeName;
  const {error:uploadError}=await supabase.storage.from("magic-hour-assets").upload(storagePath,selectedAssetFile,{contentType:selectedAssetFile.type||"application/octet-stream",upsert:false});
  if(uploadError)throw uploadError;
  const {error:assetError}=await supabase.from("mh_assets").insert({user_id:currentUser.id,project_id:projectId,storage_path:storagePath,file_name:selectedAssetFile.name,mime_type:selectedAssetFile.type||null,size_bytes:selectedAssetFile.size});
  if(assetError){await supabase.storage.from("magic-hour-assets").remove([storagePath]);throw assetError;}
  selectedAssetFile=null;selectedFile=null;workspaceNotice="Project saved and file uploaded to your private Supabase storage.";await loadAccountData();workspaceBusy=false;render();
 }catch(error){workspaceBusy=false;workspaceNotice="Could not save project: "+(error?.message||String(error));render();}
 return;
}});
app.addEventListener("input",e=>{
 if(e.target.id!=="admin-user-search")return;
 const query=String(e.target.value||"").trim().toLowerCase();
 const table=app.querySelector(".admin-room-main .admin-table-wrap tbody");
 table?.querySelectorAll("tr").forEach(row=>{row.hidden=!!query&&!row.textContent.toLowerCase().includes(query);});
});
app.addEventListener("change",async e=>{const input=e.target.closest("[data-feature-enabled]");const tier=e.target.closest("[data-feature-tier]");const cost=e.target.closest("[data-feature-cost]");const control=input||tier||cost;if(!control)return;const tool=control.dataset.featureEnabled||control.dataset.featureTier||control.dataset.featureCost;try{const payload={tool_id:tool};if(input)payload.enabled=input.checked;if(tier)payload.access_tier=tier.value;if(cost)payload.coin_cost=Number(cost.value);await adminConsoleRequest("set_feature",payload);adminRoomNotice="Feature settings saved.";await loadPublicSiteConfig();await loadAdminRoom("Site Features");}catch(error){adminRoomNotice=error.message||String(error);await loadAdminRoom("Site Features");}});
app.addEventListener("submit",async e=>{
if(e.target.id==="admin-media-upload"){e.preventDefault();if(!isAdmin||!currentUser){adminUploadNotice="Admin sign-in is required.";render();return;}const file=selectedAdminUploadFile;if(!file){adminUploadNotice="Choose a file first.";render();return;}if(file.size>100*1024*1024){adminUploadNotice="This file exceeds the 100 MB storage limit.";render();return;}adminUploadBusy=true;adminUploadNotice="Uploading securely to private storage…";render();const safeName=file.name.replace(/[^a-zA-Z0-9._-]+/g,"-").slice(-120)||"upload";const storagePath=currentUser.id+"/site-media/"+crypto.randomUUID()+"-"+safeName;try{const {error:uploadError}=await supabase.storage.from("magic-hour-assets").upload(storagePath,file,{contentType:file.type||"application/octet-stream",upsert:false});if(uploadError)throw uploadError;const {error:assetError}=await supabase.from("mh_assets").insert({user_id:currentUser.id,project_id:null,storage_path:storagePath,file_name:file.name.slice(0,240),mime_type:file.type||null,size_bytes:file.size});if(assetError){await supabase.storage.from("magic-hour-assets").remove([storagePath]);throw assetError;}selectedAdminUploadFile=null;adminUploadNotice="Upload complete. The file is stored privately in your admin media library.";await loadAccountData();}catch(error){adminUploadNotice="Upload failed: "+(error?.message||String(error));}finally{adminUploadBusy=false;render();}}
if(e.target.id==="admin-campaign-form"){e.preventDefault();const fd=new FormData(e.target);const placements=fd.getAll("placements");if(!placements.length){adminCampaignNotice="Choose at least one placement.";render();return;}const asIso=v=>v?new Date(String(v)).toISOString():null;const payload={id:editingCampaign?.id||undefined,title:String(fd.get("title")||""),message:String(fd.get("message")||""),asset_id:String(fd.get("asset_id")||""),placements,starts_at:asIso(fd.get("starts_at")),ends_at:asIso(fd.get("ends_at")),link_url:String(fd.get("link_url")||"")};const submit=e.target.querySelector("button[type=submit]");submit.disabled=true;submit.textContent="Saving…";try{const wasEditing=!!editingCampaign;await campaignServiceRequest("save",payload);editingCampaign=null;adminCampaignNotice=wasEditing?"Campaign updated. Its current status was preserved.":"Campaign saved as a draft. Activate it when ready.";await loadAdminCampaigns();await loadPublicCampaigns();}catch(error){adminCampaignNotice="Could not save campaign: "+(error?.message||String(error));render();}return;}
if(e.target.id==="support-ticket-form"){e.preventDefault();const fd=new FormData(e.target);const button=e.target.querySelector("button[type=submit]");button.disabled=true;button.textContent="Sending…";try{const {data,error}=await supabase.functions.invoke("admin-console",{body:{action:"submit_support",email:String(fd.get("email")||""),subject:String(fd.get("subject")||""),message:String(fd.get("message")||"")}});if(error)throw error;if(data?.error)throw new Error(data.error);e.target.reset();const note=e.target.querySelector("#support-ticket-notice");if(note)note.textContent="Request received. Ticket ID: "+data.ticket.id;button.textContent="Request sent";await loadAccountData();}catch(error){const note=e.target.querySelector("#support-ticket-notice");if(note)note.textContent=error.message||String(error);button.disabled=false;button.textContent="Send support request";}return;}
if(e.target.id==="admin-experiment-form"){e.preventDefault();const fd=new FormData(e.target);try{await adminConsoleRequest("save_experiment",{name:String(fd.get("name")||""),description:String(fd.get("description")||""),traffic_percent:Number(fd.get("traffic_percent")),variants:String(fd.get("variants")||"control,variant-a").split(",").map(x=>x.trim()).filter(Boolean)});adminRoomNotice="Experiment saved in paused state.";await loadAdminRoom("Feature Experiments");}catch(error){adminRoomNotice=error.message||String(error);render();}return;}
if(e.target.matches("[data-support-ticket]")){e.preventDefault();const fd=new FormData(e.target);try{await adminConsoleRequest("update_support_ticket",{id:e.target.dataset.supportTicket,status:String(fd.get("status")||"open"),admin_reply:String(fd.get("admin_reply")||"")});adminRoomNotice="Support ticket updated.";await loadAdminRoom("Support");}catch(error){adminRoomNotice=error.message||String(error);render();}return;}
if(e.target.id==="admin-appearance-form"){e.preventDefault();const fd=new FormData(e.target);const settings={brand_name:String(fd.get("brand_name")||""),logo_url:String(fd.get("logo_url")||""),favicon_url:String(fd.get("favicon_url")||""),social_image_url:String(fd.get("social_image_url")||""),accent_color:String(fd.get("accent_color")||"#a879ef")};try{await adminConsoleRequest("save_settings",{settings});adminRoomNotice="Appearance settings saved.";await loadPublicSiteConfig();await loadAdminRoom("Appearance");}catch(error){adminRoomNotice=error.message||String(error);render();}return;}
if(e.target.id==="admin-wallet-adjust-form"){e.preventDefault();const fd=new FormData(e.target);if(!confirm("Apply this wallet adjustment?"))return;try{const result=await adminConsoleRequest("adjust_wallet",{email:String(fd.get("email")||""),amount:Number(fd.get("amount")),description:String(fd.get("description")||"")});adminRoomNotice="Wallet updated. New balance: "+Number(result.balance).toLocaleString()+" coins.";if(String(fd.get("email")||"").trim().toLowerCase()===(currentUser?.email||"").toLowerCase())await loadAccountData();await loadAdminRoom("Finance");}catch(error){adminRoomNotice=error.message||String(error);render();}return;}
if(e.target.id==="admin-membership-form"){e.preventDefault();const fd=new FormData(e.target);if(!confirm("Grant or renew this membership?"))return;try{await adminConsoleRequest("grant_membership",{email:String(fd.get("email")||""),plan_name:String(fd.get("plan_name")||""),days:Number(fd.get("days")),unlimited_generations:fd.get("unlimited_generations")==="on",unlimited_duration:fd.get("unlimited_duration")==="on"});adminRoomNotice="Membership granted.";if(String(fd.get("email")||"").trim().toLowerCase()===(currentUser?.email||"").toLowerCase())await loadAccountData();await loadAdminRoom("Finance");}catch(error){adminRoomNotice=error.message||String(error);render();}return;}
if(e.target.id==="admin-settings-form"){e.preventDefault();const fd=new FormData(e.target);const settings={announcement:String(fd.get("announcement")||""),homepage_headline:String(fd.get("homepage_headline")||""),support_email:String(fd.get("support_email")||""),maintenance_mode:fd.get("maintenance_mode")==="on"};try{await adminConsoleRequest("save_settings",{settings});adminRoomNotice="Platform settings saved.";await loadPublicSiteConfig();await loadAdminRoom("Site Settings");}catch(error){adminRoomNotice=error.message||String(error);render();}return;}
if(e.target.matches("[data-admin-issue]")){e.preventDefault();const fd=new FormData(e.target);try{await adminConsoleRequest("update_issue",{id:e.target.dataset.adminIssue,status:String(fd.get("status")||"open"),admin_notes:String(fd.get("admin_notes")||"")});adminRoomNotice="Issue updated.";await loadAdminRoom("Issue Desk");}catch(error){adminRoomNotice=error.message||String(error);render();}return;}
if(e.target.id==="admin-room-issue-form"){e.preventDefault();const fd=new FormData(e.target);try{await adminConsoleRequest("create_issue",{title:String(fd.get("title")||""),severity:String(fd.get("severity")||"medium"),details:String(fd.get("details")||"")});adminRoomNotice="Issue recorded.";await loadAdminRoom("Issue Desk");}catch(error){adminRoomNotice=error.message||String(error);render();}return;}
if(e.target.id==="admin-announcement-form"){e.preventDefault();const fd=new FormData(e.target);try{await adminConsoleRequest("save_announcement",{title:String(fd.get("title")||""),body:String(fd.get("body")||""),starts_at:fd.get("starts_at")?new Date(fd.get("starts_at")).toISOString():null,ends_at:fd.get("ends_at")?new Date(fd.get("ends_at")).toISOString():null});adminRoomNotice="Announcement published.";await loadPublicSiteConfig();await loadAdminRoom(activeAdminRoom==="Notifications"?"Notifications":"Announcements");}catch(error){adminRoomNotice=error.message||String(error);render();}return;}
if(e.target.id==="admin-issue-form"){e.preventDefault();const fd=new FormData(e.target);const btn=e.target.querySelector("button[type=submit]");btn.disabled=true;try{await adminConsoleRequest("create_issue",{title:String(fd.get("title")||""),severity:String(fd.get("severity")||"medium"),details:String(fd.get("details")||"")});await loadAdminDashboard(true);}catch(error){alert("Could not record issue: "+(error.message||error));btn.disabled=false;}return;}
});
app.addEventListener("submit",async e=>{if(e.target.id==="shipment-viewer-message"){e.preventDefault();const message=String(new FormData(e.target).get("message")||"").trim();if(!message)return;const slug=new URLSearchParams(location.search).get("shipment")||"";const {ok,error}=await (async()=>{const response=await fetch(SUPABASE_URL+"/functions/v1/shipment-public",{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_ANON_KEY},body:JSON.stringify({action:"message",slug,password:publicShipmentPassword,message})});return await response.json();})();if(!ok){publicShipmentError=error||"Message could not be sent.";render();return;}const response=await fetch(SUPABASE_URL+"/functions/v1/shipment-public",{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_ANON_KEY},body:JSON.stringify({action:"view",slug,password:publicShipmentPassword})});publicShipmentData=await response.json();render();return;}if(e.target.id==="shipment-update-form"){e.preventDefault();const fd=new FormData(e.target);const departure=new Date(fd.get("departure")),arrival=new Date(fd.get("arrival"));if(!(arrival>departure)){shipmentNotice="Expected arrival must be later than departure.";render();return;}const oc=String(fd.get("origin_country")||"").trim(),dc=String(fd.get("destination_country")||"").trim(),oci=String(fd.get("origin_city")||"").trim(),dci=String(fd.get("destination_city")||"").trim();const eventType=String(fd.get("event_type")||"checkpoint"),details=String(fd.get("details")||"").trim(),stopLocation=String(fd.get("stop_location")||"").trim(),blocking=eventType==="blockage",clearing=eventType==="clear_blockage",wasBlocked=!!shipmentCreated.is_obstructed,timelineStart=new Date(shipmentCreated.departure_at).getTime(),timelineEnd=new Date(shipmentCreated.arrival_at).getTime(),pausedSeconds=Number(shipmentCreated.paused_duration_seconds)||0,progressAtUpdate=timelineEnd>timelineStart?Math.max(0,Math.min(100,(Date.now()-timelineStart-pausedSeconds*1000)/(timelineEnd-timelineStart)*100)):Number(shipmentCreated.progress_percent)||0;const nextStatus=blocking?"blocked":clearing||eventType==="resume"?"in_transit":eventType==="delay"||eventType==="stop"?"delayed":(shipmentCreated.status||"in_transit");const {error:updateError}=await supabase.from("ms_shipments").update({origin:oci+", "+oc,destination:dci+", "+dc,origin_country:oc,destination_country:dc,origin_city:oci,destination_city:dci,operator_name:String(fd.get("operator_name")||"").trim(),current_location:String(fd.get("current_location")||"").trim(),current_lat:fd.get("current_lat")?Number(fd.get("current_lat")):null,current_lng:fd.get("current_lng")?Number(fd.get("current_lng")):null,public_status_label:blocking?"Shipment paused — obstruction":clearing?"Shipment resumed":String(fd.get("public_status_label")||"").trim(),delivery_estimate:String(fd.get("delivery_estimate")||"").trim(),departure_at:departure.toISOString(),arrival_at:arrival.toISOString(),status:nextStatus,is_obstructed:blocking?true:clearing?false:wasBlocked,obstruction_reason:blocking?(details||"Shipment temporarily blocked"):clearing?null:shipmentCreated.obstruction_reason,obstruction_location:blocking?(stopLocation||shipmentCreated.current_location||null):clearing?null:shipmentCreated.obstruction_location,obstructed_at:blocking?new Date().toISOString():clearing?null:shipmentCreated.obstructed_at,paused_duration_seconds:clearing?pausedSeconds+(shipmentCreated.obstructed_at?Math.max(0,Math.floor((Date.now()-new Date(shipmentCreated.obstructed_at).getTime())/1000)):0):pausedSeconds,progress_percent:clearing?(Number(shipmentCreated.paused_progress)||progressAtUpdate):blocking?progressAtUpdate:shipmentCreated.progress_percent,paused_progress:blocking?progressAtUpdate:clearing?null:shipmentCreated.paused_progress,updated_at:new Date().toISOString()}).eq("id",shipmentCreated.id).eq("user_id",currentUser.id);if(updateError){shipmentNotice=updateError.message;render();return;}const {error:eventError}=await supabase.from("ms_shipment_events").insert({shipment_id:shipmentCreated.id,user_id:currentUser.id,event_title:String(fd.get("title")).trim(),event_details:(stopLocation?"Stop location: "+stopLocation+"\n":"")+details,event_at:new Date().toISOString(),event_type:eventType});if(eventError){shipmentNotice="Route saved, but update notice failed: "+eventError.message;}else{shipmentNotice="Shipment route and update published.";shipmentCreated.origin=oci+", "+oc;shipmentCreated.destination=dci+", "+dc;shipmentCreated.origin_country=oc;shipmentCreated.destination_country=dc;shipmentCreated.origin_city=oci;shipmentCreated.destination_city=dci;shipmentCreated.operator_name=String(fd.get("operator_name")||"");shipmentCreated.current_location=String(fd.get("current_location")||"");shipmentCreated.current_lat=fd.get("current_lat")?Number(fd.get("current_lat")):null;shipmentCreated.current_lng=fd.get("current_lng")?Number(fd.get("current_lng")):null;shipmentCreated.public_status_label=blocking?"Shipment paused — obstruction":clearing?"Shipment resumed":String(fd.get("public_status_label")||"").trim();shipmentCreated.delivery_estimate=String(fd.get("delivery_estimate")||"").trim();shipmentCreated.departure_at=departure.toISOString();shipmentCreated.arrival_at=arrival.toISOString();shipmentCreated.status=nextStatus;shipmentCreated.is_obstructed=blocking?true:clearing?false:wasBlocked;shipmentCreated.obstruction_reason=blocking?(details||"Shipment temporarily blocked"):clearing?null:shipmentCreated.obstruction_reason;shipmentCreated.obstruction_location=blocking?(stopLocation||shipmentCreated.current_location||null):clearing?null:shipmentCreated.obstruction_location;shipmentCreated.paused_duration_seconds=clearing?pausedSeconds+(shipmentCreated.obstructed_at?Math.max(0,Math.floor((Date.now()-new Date(shipmentCreated.obstructed_at).getTime())/1000)):0):pausedSeconds;shipmentCreated.obstructed_at=blocking?new Date().toISOString():clearing?null:shipmentCreated.obstructed_at;shipmentCreated.progress_percent=clearing?(Number(shipmentCreated.paused_progress)||progressAtUpdate):blocking?progressAtUpdate:shipmentCreated.progress_percent;shipmentCreated.paused_progress=blocking?progressAtUpdate:clearing?null:shipmentCreated.paused_progress;}render();return;}if(e.target.id==="shipment-sender-message"){e.preventDefault();const message=String(new FormData(e.target).get("message")||"").trim();if(!message)return;const {error}=await supabase.from("ms_shipment_messages").insert({shipment_id:shipmentCreated.id,sender_role:"sender",sender_name:shipmentCreated.sender_name||"Sender",message});if(error){shipmentNotice="Message could not be sent: "+error.message;}else{await loadShipmentOwnerMessages();shipmentNotice="Message sent to recipient.";}render();return;}if(e.target.id==="shipment-access-form"){e.preventDefault();const fd=new FormData(e.target);const slug=String(fd.get("slug")||"");const password=String(fd.get("password")||"");const button=e.target.querySelector("button[type=submit]");button.disabled=true;button.textContent="Opening…";publicShipmentError="";try{const response=await fetch(SUPABASE_URL+"/functions/v1/shipment-public",{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_ANON_KEY},body:JSON.stringify({action:"view",slug,password})});const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||"Could not open tracking page.");publicShipmentData=data;publicShipmentPassword=password;render();}catch(error){publicShipmentError=error?.message||String(error);render();}return;}if(e.target.id==="shipment-create-form"){e.preventDefault();if(!currentUser){shipmentNotice="Please sign in again.";render();return;}const fd=new FormData(e.target);const departure=new Date(fd.get("departure"));const arrival=new Date(fd.get("arrival"));if(!(arrival>departure)){shipmentNotice="Expected arrival must be later than departure.";render();return;}if(shipmentPhotoFiles.length>8){shipmentNotice="Choose no more than 8 photos.";render();return;}if(shipmentPhotoFiles.some(file=>file.size>10*1024*1024)){shipmentNotice="Each shipment photo must be 10 MB or smaller.";render();return;}if(shipmentVideoFile&&shipmentVideoFile.size>30*1024*1024){shipmentNotice="The video must be 30 MB or smaller.";render();return;}shipmentBusy=true;shipmentNotice="Creating your private shipment page…";render();let projectId=null;let uploaded=[];try{const code="MS"+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,6).toUpperCase();const slug=crypto.randomUUID().replace(/-/g,"");const password=Array.from(crypto.getRandomValues(new Uint8Array(9))).map(x=>"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[x%56]).join("");const salt=crypto.randomUUID();const bytes=new TextEncoder().encode(salt+":"+password);const digest=await crypto.subtle.digest("SHA-256",bytes);const hash=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");const {data:project,error:pe}=await supabase.from("mh_projects").insert({user_id:currentUser.id,title:"Shipment "+code,tool_id:"shipment-room",status:"draft",metadata:{carrier:String(fd.get("carrier")),transport:String(fd.get("transport"))}}).select("id").single();if(pe)throw pe;projectId=project.id;const {data:shipment,error:se}=await supabase.from("ms_shipments").insert({user_id:currentUser.id,project_id:projectId,tracking_code:code,tracking_slug:slug,access_password_hash:salt+":"+hash,carrier:String(fd.get("carrier")),transport_mode:String(fd.get("transport")),sender_name:String(fd.get("sender")).trim(),recipient_name:String(fd.get("recipient")).trim(),origin:String(fd.get("origin_city")||fd.get("origin")).trim()+", "+String(fd.get("origin_country")||"").trim(),destination:String(fd.get("destination_city")||fd.get("destination")).trim()+", "+String(fd.get("destination_country")||"").trim(),origin_country:String(fd.get("origin_country")||"").trim(),destination_country:String(fd.get("destination_country")||"").trim(),origin_city:String(fd.get("origin_city")||"").trim(),destination_city:String(fd.get("destination_city")||"").trim(),operator_name:String(fd.get("operator_name")||fd.get("carrier")).trim(),current_location:String(fd.get("current_location")||"").trim()||String(fd.get("origin_city")||"").trim(),current_lat:fd.get("current_lat")?Number(fd.get("current_lat")):null,current_lng:fd.get("current_lng")?Number(fd.get("current_lng")):null,barcode_value:code,item_names:String(fd.get("items")).trim(),departure_at:departure.toISOString(),arrival_at:arrival.toISOString()}).select("id,tracking_code,tracking_slug").single();if(se)throw se;const media=[...shipmentPhotoFiles,...(shipmentVideoFile?[shipmentVideoFile]:[])];for(const file of media){const kind=file.type.startsWith("video/")?"video":"photo";const path=currentUser.id+"/"+projectId+"/"+Date.now()+"-"+crypto.randomUUID()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");const {error:ue}=await supabase.storage.from("magic-hour-assets").upload(path,file,{contentType:file.type,upsert:false});if(ue)throw ue;uploaded.push(path);const {error:me}=await supabase.from("ms_shipment_media").insert({shipment_id:shipment.id,user_id:currentUser.id,storage_path:path,file_name:file.name,mime_type:file.type,size_bytes:file.size,media_kind:kind});if(me)throw me;const {error:assetError}=await supabase.from("mh_assets").insert({user_id:currentUser.id,project_id:project.id,storage_path:path,file_name:file.name,mime_type:file.type,size_bytes:file.size});if(assetError)throw assetError;}const {error:ee}=await supabase.from("ms_shipment_events").insert([{shipment_id:shipment.id,user_id:currentUser.id,event_title:"Shipment received",event_details:"Shipment details have been recorded.",event_at:new Date().toISOString(),event_type:"received"},{shipment_id:shipment.id,user_id:currentUser.id,event_title:"Journey departure",event_details:"Scheduled departure from "+String(fd.get("origin_city"))+", "+String(fd.get("origin_country")),event_at:departure.toISOString(),event_type:"departure"},{shipment_id:shipment.id,user_id:currentUser.id,event_title:"Expected arrival",event_details:"Scheduled arrival at "+String(fd.get("destination_city"))+", "+String(fd.get("destination_country")),event_at:arrival.toISOString(),event_type:"arrival"}]);if(ee)throw ee;shipmentCreated={id:shipment.id,tracking_code:shipment.tracking_code,tracking_slug:shipment.tracking_slug,origin_country:String(fd.get("origin_country")),destination_country:String(fd.get("destination_country")),origin_city:String(fd.get("origin_city")),destination_city:String(fd.get("destination_city")),operator_name:String(fd.get("operator_name")),url:"https://muskyp2v-ai-studio-tracking-site.vercel.app/?shipment="+shipment.tracking_slug,password,origin:String(fd.get("origin")),destination:String(fd.get("destination")),sender_name:String(fd.get("sender")),departure_at:departure.toISOString(),arrival_at:arrival.toISOString()};await loadShipmentOwnerMessages();shipmentPhotoFiles=[];shipmentVideoFile=null;shipmentNotice="Shipment created. Copy the tracking link and password to share them with your recipient.";await loadAccountData();}catch(error){shipmentNotice="Could not create shipment: "+(error?.message||String(error));}finally{shipmentBusy=false;render();}return;}if(e.target.id==="auth-form"){e.preventDefault();const fd=new FormData(e.target);const submit=e.target.querySelector("button[type=submit]");submit.disabled=true;submit.textContent="Please wait…";let result;if(authMode==="phone"){pendingPhone=String(fd.get("phone")||"").trim();result=await supabase.auth.signInWithOtp({phone:pendingPhone});if(!result.error){authMode="phone-verify";authNotice="A verification code was requested. Delivery depends on your configured SMS/WhatsApp provider.";renderAuth();return;}}else if(authMode==="phone-verify"){result=await supabase.auth.verifyOtp({phone:pendingPhone,token:String(fd.get("otp")||"").trim(),type:"sms"});}else{const email=String(fd.get("email")||"").trim();const password=String(fd.get("password")||"");if(authMode==="signup"){result=await supabase.auth.signUp({email,password,options:{emailRedirectTo:"https://magichour-black.vercel.app",data:{full_name:String(fd.get("name")||"").trim()}}});}else{result=await supabase.auth.signInWithPassword({email,password});}}submit.disabled=false;if(result.error){authNotice=result.error.message;renderAuth();}else if(authMode==="signup"&&!result.data.session){authNotice="Account created. Check your inbox and spam folder for the confirmation email.";renderAuth();}else if(authMode==="phone"||authMode==="phone-verify"){currentUser=result.data.user||null;authNotice="";page="Home";render();}else{currentUser=result.data.user||null;authNotice="";page="Home";render();}return;}});
app.addEventListener("input",e=>{if(e.target.id==="video-prompt")videoPromptText=e.target.value;if(e.target.id==="social-search"){const q=e.target.value.toLowerCase().trim();app.querySelectorAll(".social-product").forEach(card=>{card.hidden=q&&!card.textContent.toLowerCase().includes(q);});app.querySelectorAll(".social-category").forEach(section=>{section.hidden=q&&!section.querySelector(".social-product:not([hidden])");});}});
let shipmentCountriesLoaded=false;
async function loadWorldwideShipmentCountries(){if(shipmentCountriesLoaded)return;shipmentCountriesLoaded=true;try{const response=await fetch("https://countriesnow.space/api/v0.1/countries");if(!response.ok)throw new Error("Country directory unavailable");const result=await response.json();const rows=Array.isArray(result.data)?result.data:[];if(!rows.length)throw new Error("Empty country directory");for(const key of Object.keys(shipmentPlaces))delete shipmentPlaces[key];for(const row of rows){if(row.country)shipmentPlaces[row.country]=Array.isArray(row.cities)?row.cities:[];}const selectedCities={};app.querySelectorAll("select[data-shipment-city]").forEach(select=>selectedCities[select.dataset.shipmentCity]=select.value);const options=shipmentCountryOptionsFor();app.querySelectorAll("select[data-shipment-country]").forEach(select=>{const selected=select.value;select.innerHTML=options;select.value=selected&&shipmentPlaces[selected]!==undefined?selected:"";});app.querySelectorAll("select[data-shipment-city]").forEach(select=>{const side=select.dataset.shipmentCity;const country=app.querySelector('select[data-shipment-country="'+side+'"]')?.value;select.innerHTML=shipmentCityOptions(country,selectedCities[side]||"");});}catch(error){shipmentCountriesLoaded=false;console.warn("Worldwide country directory:",error.message||error);}}
app.addEventListener("change",e=>{if(e.target.id==="admin-media-file"){selectedAdminUploadFile=e.target.files?.[0]||null;adminUploadNotice="";const status=app.querySelector("#admin-upload-selected");if(status)status.textContent=selectedAdminUploadFile?selectedAdminUploadFile.name:"No file selected";const submit=app.querySelector("#admin-media-upload button[type=submit]");if(submit)submit.disabled=!selectedAdminUploadFile||adminUploadBusy;return;}if(e.target.matches("select[data-shipment-country]")){const side=e.target.dataset.shipmentCountry,country=e.target.value,city=app.querySelector('select[data-shipment-city="'+side+'"]');if(city){city.innerHTML='<option value="">Loading cities…</option>';fetch("https://countriesnow.space/api/v0.1/countries/cities",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({country})}).then(r=>r.json()).then(result=>{const cities=Array.isArray(result.data)?result.data:[];city.innerHTML=cities.map(name=>'<option value="'+esc(name)+'">'+esc(name)+'</option>').join("")||'<option value="">No cities returned — enter city manually</option>';city.disabled=false;}).catch(()=>{city.innerHTML=shipmentCityOptions(country)||'<option value="">City list unavailable — enter city manually</option>';});}const operator=app.querySelector("select[data-shipment-operator]");if(operator&&side==="origin")operator.innerHTML=shipmentOperatorOptions(country);return;}if(e.target.id==="shipment-photos"){shipmentPhotoFiles=[...(e.target.files||[])].slice(0,8);const status=document.querySelector("#shipment-file-status");if(status)status.textContent=shipmentPhotoFiles.length+" photo(s) selected";return;}if(e.target.id==="shipment-video"){shipmentVideoFile=e.target.files?.[0]||null;const status=document.querySelector("#shipment-file-status");if(status)status.textContent=(shipmentPhotoFiles.length+" photo(s) and "+(shipmentVideoFile?shipmentVideoFile.name:"no video")+" selected");return;}if(e.target.matches("input[data-social-item]")){pendingSocialSelection=[...app.querySelectorAll("input[data-social-item]:checked")].map(input=>input.value);persistWorkspaceState();return;}if(e.target.id==="social-search"){const q=e.target.value.toLowerCase().trim();app.querySelectorAll(".social-product").forEach(card=>{card.hidden=q&&!card.textContent.toLowerCase().includes(q);});app.querySelectorAll(".social-category").forEach(section=>{section.hidden=q&&!section.querySelector(".social-product:not([hidden])");});return;}if(e.target.id==="video-image-upload"&&e.target.files?.[0]){selectedVideoFile=e.target.files[0];if(videoPreviewUrl)URL.revokeObjectURL(videoPreviewUrl);videoPreviewUrl=URL.createObjectURL(selectedVideoFile);workspaceNotice="Source image selected. Add a motion prompt to continue.";workspaceResultUrl="";render();return;}if(e.target.id==="video-duration"){videoDurationSeconds=Number(e.target.value)||5;render();return;}if(e.target.id==="video-ratio"){videoAspectRatio=e.target.value||"16:9";render();return;}if(e.target.id==="reference-face-upload"&&e.target.files?.[0]){selectedReferenceFace=e.target.files[0];selectedReferenceAssetId="";if(referencePreviewUrl)URL.revokeObjectURL(referencePreviewUrl);referencePreviewUrl=URL.createObjectURL(selectedReferenceFace);workspaceNotice="Face image selected. Now choose the body image.";render();return;}if(e.target.id==="target-image-upload"&&e.target.files?.[0]){selectedTargetImage=e.target.files[0];selectedTargetAssetId="";if(targetPreviewUrl)URL.revokeObjectURL(targetPreviewUrl);targetPreviewUrl=URL.createObjectURL(selectedTargetImage);workspaceNotice="Body image selected. Ready when both images are selected.";render();return;}if(e.target.id==="bg-upload"&&e.target.files?.[0]){selectedAssetFile=e.target.files[0];selectedFile=selectedAssetFile.name;workspaceResultUrl="";workspaceNotice="Image selected. Ready to remove its background.";render();return;}if(e.target.id==="asset-upload"&&e.target.files?.[0]){selectedAssetFile=e.target.files[0];selectedFile=e.target.files[0].name;const status=document.querySelector("#file-status");if(status)status.textContent="Selected: "+selectedFile;}});
app.addEventListener("submit",e=>{if(e.target.id==="chat-form"){e.preventDefault();const input=e.target.querySelector("input");sendMessage(input.value);}});
// Progressive Web App setup and Android install prompt
let deferredInstallPrompt=null;
window.addEventListener("beforeinstallprompt",event=>{
 event.preventDefault();
 deferredInstallPrompt=event;
 const button=document.getElementById("install-app");
 if(button)button.hidden=false;
});
window.addEventListener("appinstalled",()=>{
 deferredInstallPrompt=null;
 const button=document.getElementById("install-app");
 if(button)button.hidden=true;
});
document.addEventListener("click",async event=>{
 const button=event.target.closest("#install-app");
 if(!button)return;
 if(!deferredInstallPrompt){
  alert("To install Magic Hour, open this site in Chrome, tap the three-dot menu, then choose Install app or Add to Home screen.");
  return;
 }
 deferredInstallPrompt.prompt();
 await deferredInstallPrompt.userChoice;
 deferredInstallPrompt=null;
 button.hidden=true;
});
if("serviceWorker" in navigator){
 window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(error=>console.warn("PWA service worker:",error)));
}

function renderCampaignPublicPlacements(){
 const homepage=publicCampaigns.filter(c=>c.placements?.includes("homepage"));
 const welcome=publicCampaigns.find(c=>c.placements?.includes("welcome"));
 const media=c=>c.media_type?.startsWith("video/")?'<video src="'+esc(c.media_url)+'" autoplay muted loop playsinline></video>':'<img src="'+esc(c.media_url)+'" alt="'+esc(c.title)+'">';
 const strip=homepage.length?'<section class="campaign-home-strip" aria-label="Featured announcements">'+homepage.map(c=>'<article class="campaign-home-card">'+media(c)+'<div><b>'+esc(c.title)+'</b><p>'+esc(c.message||"")+'</p>'+(c.link_url?'<a href="'+esc(c.link_url)+'" target="_blank" rel="noopener">Learn more ↗</a>':"")+'</div></article>').join("")+'</section>':"";
 let overlay="";
 if(welcome&&!welcomeCampaignShown){
  welcomeCampaignShown=true;
  try{sessionStorage.setItem("mh_welcome_campaign_seen","1");}catch{}
  overlay='<div class="campaign-welcome-overlay" role="dialog" aria-modal="true" aria-label="'+esc(welcome.title)+'"><div class="campaign-welcome-card"><button class="campaign-dismiss" data-campaign-dismiss aria-label="Close campaign">×</button><div class="campaign-public-media">'+media(welcome)+'</div><div class="campaign-public-copy"><h2>'+esc(welcome.title)+'</h2><p>'+esc(welcome.message||"")+'</p>'+(welcome.link_url?'<a class="primary-btn" href="'+esc(welcome.link_url)+'" target="_blank" rel="noopener">Learn more</a>':"")+'</div></div></div>';
 }
 return strip+overlay;
}

render();
loadPublicSiteConfig();
loadPublicCampaigns();
initializeAppAuth();
