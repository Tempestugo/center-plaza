import{m as e,u as p,ar as y,as as k,r as x,j as a,B as t,l as u,at as g,au as b,C as v,F as j}from"./index-BTa_jDdP.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=e("BarChart3",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=e("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=e("CalendarDays",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 18h.01",key:"lrp35t"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M16 18h.01",key:"kzsmim"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=e("Home",[["path",{d:"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"y5dka4"}],["polyline",{points:"9 22 9 12 15 12 15 22",key:"e2us08"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=e("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]),z=[{label:"Dashboard",href:"/admin/dashboard",icon:f},{label:"Hospedagens",href:"/admin/hospedagens",icon:w},{label:"Reservas",href:"/admin/reservas",icon:v},{label:"Disponibilidade",href:"/admin/disponibilidade",icon:M},{label:"Concluídas",href:"/admin/reservas-concluidas",icon:j},{label:"Relatórios",href:"/admin/relatorios",icon:C}];function A({children:l,headerRight:r}){const s=p(),{pathname:c}=y(),{logout:o,isAdmin:n}=k();x.useEffect(()=>{!localStorage.getItem("admin_token")&&!n&&s("/admin")},[s,n]);const d=()=>{o(),s("/admin")};return a.jsxs("div",{className:"min-h-screen bg-background",children:[a.jsx("header",{className:"border-b bg-background/95 backdrop-blur sticky top-0 z-50",children:a.jsxs("div",{className:"flex h-16 items-center justify-between px-6",children:[a.jsx("h1",{className:"text-xl font-bold text-primary",children:"Center Plaza Admin"}),a.jsxs("div",{className:"flex items-center gap-2",children:[r,a.jsxs(t,{variant:"ghost",size:"icon",className:"relative",children:[a.jsx(N,{className:"h-4 w-4"}),a.jsx(u,{className:"absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]",children:"3"})]}),a.jsx(t,{variant:"ghost",size:"icon",children:a.jsx(g,{className:"h-4 w-4"})}),a.jsx(t,{variant:"ghost",size:"icon",onClick:d,title:"Sair",children:a.jsx(b,{className:"h-4 w-4"})})]})]})}),a.jsxs("div",{className:"flex",children:[a.jsx("aside",{className:"w-56 border-r bg-background/95 h-[calc(100vh-4rem)] sticky top-16 shrink-0",children:a.jsx("nav",{className:"p-3 space-y-1",children:z.map(({label:h,href:i,icon:m})=>a.jsxs(t,{variant:c===i?"default":"ghost",className:"w-full justify-start",onClick:()=>s(i),children:[a.jsx(m,{className:"mr-2 h-4 w-4"}),h]},i))})}),a.jsx("main",{className:"flex-1 min-w-0 p-6",children:l})]})]})}export{A,f as B,M as C,w as H,C as T};
