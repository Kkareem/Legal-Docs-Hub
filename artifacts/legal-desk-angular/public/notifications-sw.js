self.addEventListener('push',event=>{
 let data={};try{data=event.data?event.data.json():{};}catch{}
 event.waitUntil(self.registration.showNotification(data.title||'LegalDesk',{
  body:data.body||'يوجد تحديث جديد في حسابك',icon:'/app-icon-192.png',badge:'/app-icon-192.png',data:{url:'/notifications'},tag:'legaldesk-update'
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{const url=new URL('/notifications',self.location.origin).href;
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of windows){if(new URL(client.url).origin===self.location.origin){await client.navigate(url);return client.focus();}}
  return self.clients.openWindow(url);
 })());
});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('install',()=>self.skipWaiting());
// Intentionally no fetch handler: authenticated pages and case files are never cached offline.
