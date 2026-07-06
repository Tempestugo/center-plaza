import{m as n,u as h,a9 as m,r as p,j as a,B as s,l as x,aa as g,ab as k,C as u,E as b}from"./index-BRfDpOzC.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=n("BarChart3",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=n("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=n("Home",[["path",{d:"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"y5dka4"}],["polyline",{points:"9 22 9 12 15 12 15 22",key:"e2us08"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=n("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]),N=[{label:"Dashboard",href:"/admin/dashboard",icon:j},{label:"Hospedagens",href:"/admin/hospedagens",icon:v},{label:"Reservas",href:"/admin/reservas",icon:u},{label:"Concluídas",href:"/admin/reservas-concluidas",icon:b},{label:"Relatórios",href:"/admin/relatorios",icon:f}];function C({children:i,headerRight:l}){const e=h(),{pathname:r}=m();p.useEffect(()=>{localStorage.getItem("admin_token")||e("/admin")},[e]);const c=()=>{localStorage.removeItem("admin_token"),e("/admin")};return a.jsxs("div",{className:"min-h-screen bg-background",children:[a.jsx("header",{className:"border-b bg-background/95 backdrop-blur sticky top-0 z-50",children:a.jsxs("div",{className:"flex h-16 items-center justify-between px-6",children:[a.jsx("h1",{className:"text-xl font-bold text-primary",children:"Center Plaza Admin"}),a.jsxs("div",{className:"flex items-center gap-2",children:[l,a.jsxs(s,{variant:"ghost",size:"icon",className:"relative",children:[a.jsx(y,{className:"h-4 w-4"}),a.jsx(x,{className:"absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]",children:"3"})]}),a.jsx(s,{variant:"ghost",size:"icon",children:a.jsx(g,{className:"h-4 w-4"})}),a.jsx(s,{variant:"ghost",size:"icon",onClick:c,title:"Sair",children:a.jsx(k,{className:"h-4 w-4"})})]})]})}),a.jsxs("div",{className:"flex",children:[a.jsx("aside",{className:"w-56 border-r bg-background/95 h-[calc(100vh-4rem)] sticky top-16 shrink-0",children:a.jsx("nav",{className:"p-3 space-y-1",children:N.map(({label:o,href:t,icon:d})=>a.jsxs(s,{variant:r===t?"default":"ghost",className:"w-full justify-start",onClick:()=>e(t),children:[a.jsx(d,{className:"mr-2 h-4 w-4"}),o]},t))})}),a.jsx("main",{className:"flex-1 min-w-0 p-6",children:i})]})]})}export{C as A,j as B,v as H,f as T};
