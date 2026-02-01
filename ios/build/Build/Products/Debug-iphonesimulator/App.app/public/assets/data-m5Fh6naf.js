import{s as a}from"./index-BBBGEo7o.js";import"./framer-BdaCTGm4.js";import"./router-ClfHAwMg.js";import"./react-vendor-B--z-fyW.js";import"./supabase-CIvuJI4W.js";import"./icons-ByDj-hsa.js";const _=async()=>{const{data:s,error:i}=await a.from("categories").select("*").order("title");return i?(console.error("Error fetching categories:",i),[]):(s||[]).map(e=>({id:e.id,slug:e.slug,title:e.title,subtitle:e.subtitle||void 0,description:e.description||"",home_banner_url:e.home_banner_url||void 0,inner_banner_url:e.inner_banner_url||void 0,is_new:e.is_new||!1,year:e.year||void 0,available_seats:e.available_seats||void 0}))},b=async s=>{var t,o,l;const{data:i,error:e}=await a.from("quizzes").select(`
      *,
      role:roles (
        slug,
        category:categories (slug)
      )
    `).eq("slug",s).single();if(e||!i)return e&&console.error("Supabase getContestBySlug error:",e.message),null;const r=i;return{id:r.id,slug:r.slug,title:r.title,year:r.year||"",description:r.description||"",roleSlug:((t=r.role)==null?void 0:t.slug)||"",categorySlug:((l=(o=r.role)==null?void 0:o.category)==null?void 0:l.slug)||""}},h=async()=>{const s=[],{data:i}=await a.from("categories").select("id, title, slug");i&&i.forEach(t=>s.push({id:t.id,title:t.title,type:"category",url:`/concorsi/${t.slug}`}));const{data:e}=await a.from("roles").select(`
      id, title, slug,
      category:categories(slug)
    `);e&&e.forEach(t=>{var l;const o=(l=t.category)==null?void 0:l.slug;o&&s.push({id:t.id,title:t.title,type:"role",url:`/concorsi/${o}/${t.slug}`})});const{data:r}=await a.from("quizzes").select(`
      id, title, slug,
      role:roles (
        slug,
        category:categories (slug)
      )
    `).eq("is_archived",!1).limit(100);return r&&r.forEach(t=>{var n,u,g;const o=(n=t.role)==null?void 0:n.slug,l=(g=(u=t.role)==null?void 0:u.category)==null?void 0:g.slug;o&&l&&s.push({id:t.id,title:t.title,type:"contest",url:`/concorsi/${l}/${o}`})}),s};export{h as getAllSearchableItems,_ as getCategories,b as getContestBySlug};
