import { useState, useEffect, useRef } from "react";

/* ══ FIREBASE REST API (pas d'import, fonctionne partout) ══ */
const FB_PROJECT = "lions-arena-2026-c3e2d";
const FB_API_KEY = "AIzaSyAr-iO10IevsIkHHPzy38teoe6V5WQIbf4";
const FB_BASE = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents`;

/* ID unique par appareil */
function getUserId() {
  let uid = localStorage.getItem("lions_uid");
  if (!uid) { uid = "u_" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("lions_uid", uid); }
  return uid;
}

/* ══ HELPERS FIRESTORE REST ══ */
async function fbGet(col) {
  try {
    const res = await fetch(`${FB_BASE}/${col}?key=${FB_API_KEY}`);
    const d = await res.json();
    return (d.documents || []).map(doc => {
      const id = doc.name.split("/").pop();
      const fields = doc.fields || {};
      const obj = { id };
      Object.entries(fields).forEach(([k,v]) => {
        obj[k] = v.stringValue ?? v.integerValue ?? v.booleanValue ?? v.timestampValue ?? v.arrayValue?.values?.map(x=>x.stringValue) ?? null;
      });
      return obj;
    });
  } catch { return []; }
}

async function fbAdd(col, data) {
  try {
    const fields = {};
    Object.entries(data).forEach(([k,v]) => {
      if (typeof v === "number") fields[k] = { integerValue: v };
      else if (typeof v === "boolean") fields[k] = { booleanValue: v };
      else if (Array.isArray(v)) fields[k] = { arrayValue: { values: v.map(x => ({ stringValue: String(x) })) } };
      else fields[k] = { stringValue: String(v ?? "") };
    });
    fields.createdAt = { timestampValue: new Date().toISOString() };
    const res = await fetch(`${FB_BASE}/${col}?key=${FB_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields })
    });
    const d = await res.json();
    return d.name?.split("/").pop() || null;
  } catch { return null; }
}

async function fbUpdate(col, docId, data) {
  try {
    const fields = {};
    Object.entries(data).forEach(([k,v]) => {
      if (typeof v === "number") fields[k] = { integerValue: v };
      else if (Array.isArray(v)) fields[k] = { arrayValue: { values: v.map(x => ({ stringValue: String(x) })) } };
      else fields[k] = { stringValue: String(v ?? "") };
    });
    const updateMask = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join("&");
    await fetch(`${FB_BASE}/${col}/${docId}?${updateMask}&key=${FB_API_KEY}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields })
    });
  } catch {}
}

/* ══════════════════════════════════════════════════════════════
   LIONS ARENA 2026 — THE GREATEST FOOTBALL PLATFORM EVER BUILT
   Onboarding · Pronostics · Live AI Commentary · Dark/Light
   ══════════════════════════════════════════════════════════════ */

/* ══ SWIPE HOOK ══ */
function useSwipe(onSwipeRight, onSwipeLeft) {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const MIN_SWIPE = 60;

  const onTouchStart = (e) => {
    touchStart.current = e.targetTouches[0].clientX;
    touchEnd.current = null;
  };
  const onTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };
  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const dist = touchEnd.current - touchStart.current;
    if (dist > MIN_SWIPE && onSwipeRight) onSwipeRight();
    if (dist < -MIN_SWIPE && onSwipeLeft) onSwipeLeft();
  };
  return { onTouchStart, onTouchMove, onTouchEnd };
}

const THEMES = {
  dark:  { bg:"#05050A", card:"#0C0C14", card2:"#111120", border:"#1A1A2E", text:"#F0EDE6", muted:"#6A6A80", header:"rgba(5,5,10,0.96)", input:"#111120", inputBorder:"#2A2A3E" },
  light: { bg:"#F2F2F7", card:"#FFFFFF", card2:"#E8E8F0", border:"#DCDCEC", text:"#0A0A14", muted:"#888899", header:"rgba(242,242,247,0.96)", input:"#FFFFFF", inputBorder:"#CACADC" },
};
const A = { gold:"#F5C518", green:"#00C853", red:"#FF1744", blue:"#2979FF", purple:"#D500F9", cyan:"#00E5FF", orange:"#FF6D00" };

/* ══ DATA ══ */
/* ══ TOUS LES MATCHS CDM 2026 — DONNÉES OFFICIELLES FIFA ══ */
const ALL_GROUPS = [
  { group:"A", color:"#06b6d4", teams:["🇺🇸 États-Unis","🇧🇴 Bolivie","🇵🇦 Panama","🇯🇲 Jamaïque"], matches:[
    { t1:"🇺🇸 États-Unis",  t2:"🇧🇴 Bolivie",      date:"12 Juin", time:"19h00", venue:"SoFi Stadium",         city:"Los Angeles" },
    { t1:"🇵🇦 Panama",      t2:"🇯🇲 Jamaïque",     date:"12 Juin", time:"22h00", venue:"AT&T Stadium",         city:"Dallas" },
    { t1:"🇧🇴 Bolivie",     t2:"🇵🇦 Panama",       date:"16 Juin", time:"16h00", venue:"Rose Bowl",            city:"Los Angeles" },
    { t1:"🇺🇸 États-Unis",  t2:"🇯🇲 Jamaïque",     date:"16 Juin", time:"22h00", venue:"Arrowhead Stadium",   city:"Kansas City" },
    { t1:"🇧🇴 Bolivie",     t2:"🇯🇲 Jamaïque",     date:"21 Juin", time:"20h00", venue:"Levi's Stadium",      city:"San Francisco" },
    { t1:"🇵🇦 Panama",      t2:"🇺🇸 États-Unis",   date:"21 Juin", time:"20h00", venue:"MetLife Stadium",     city:"New York" },
  ]},
  { group:"B", color:"#f97316", teams:["🇦🇷 Argentine","🇪🇨 Équateur","🇨🇱 Chili","🇵🇪 Pérou"], matches:[
    { t1:"🇦🇷 Argentine",  t2:"🇵🇪 Pérou",        date:"13 Juin", time:"16h00", venue:"Estadio Azteca",      city:"Mexico City" },
    { t1:"🇪🇨 Équateur",   t2:"🇨🇱 Chili",        date:"13 Juin", time:"19h00", venue:"Estadio BBVA",        city:"Monterrey" },
    { t1:"🇨🇱 Chili",      t2:"🇦🇷 Argentine",    date:"17 Juin", time:"16h00", venue:"Estadio Akron",       city:"Guadalajara" },
    { t1:"🇵🇪 Pérou",      t2:"🇪🇨 Équateur",     date:"17 Juin", time:"22h00", venue:"AT&T Stadium",        city:"Dallas" },
    { t1:"🇵🇪 Pérou",      t2:"🇨🇱 Chili",        date:"22 Juin", time:"20h00", venue:"Estadio Azteca",      city:"Mexico City" },
    { t1:"🇦🇷 Argentine",  t2:"🇪🇨 Équateur",     date:"22 Juin", time:"20h00", venue:"Mercedes-Benz",       city:"Atlanta" },
  ]},
  { group:"C", color:"#8b5cf6", teams:["🇩🇪 Allemagne","🇯🇵 Japon","🇲🇽 Mexique","🇿🇦 Afr. du Sud"], matches:[
    { t1:"🇩🇪 Allemagne",  t2:"🇿🇦 Afr. du Sud",  date:"11 Juin", time:"16h00", venue:"Gillette Stadium",    city:"Boston" },
    { t1:"🇲🇽 Mexique",    t2:"🇯🇵 Japon",        date:"11 Juin", time:"22h00", venue:"Estadio Azteca",      city:"Mexico City" },
    { t1:"🇿🇦 Afr. du Sud",t2:"🇲🇽 Mexique",      date:"15 Juin", time:"16h00", venue:"Estadio BBVA",        city:"Monterrey" },
    { t1:"🇩🇪 Allemagne",  t2:"🇯🇵 Japon",        date:"15 Juin", time:"22h00", venue:"SoFi Stadium",        city:"Los Angeles" },
    { t1:"🇿🇦 Afr. du Sud",t2:"🇯🇵 Japon",        date:"20 Juin", time:"20h00", venue:"Lumen Field",         city:"Seattle" },
    { t1:"🇲🇽 Mexique",    t2:"🇩🇪 Allemagne",    date:"20 Juin", time:"20h00", venue:"AT&T Stadium",        city:"Dallas" },
  ]},
  { group:"D", color:"#00C853", senegal:true, teams:["🇸🇳 Sénégal","🇫🇷 France","🇳🇴 Norvège","🇮🇶 Irak"], matches:[
    { t1:"🇸🇳 Sénégal",   t2:"🇫🇷 France",      date:"16 Juin", time:"21h00", venue:"MetLife Stadium",     city:"New York",      hot:true },
    { t1:"🇳🇴 Norvège",   t2:"🇮🇶 Irak",        date:"16 Juin", time:"18h00", venue:"Levi's Stadium",      city:"San Francisco" },
    { t1:"🇫🇷 France",    t2:"🇮🇶 Irak",        date:"20 Juin", time:"18h00", venue:"Rose Bowl",           city:"Los Angeles" },
    { t1:"🇸🇳 Sénégal",   t2:"🇳🇴 Norvège",     date:"20 Juin", time:"21h00", venue:"MetLife Stadium",     city:"New York",      sn:true },
    { t1:"🇮🇶 Irak",      t2:"🇸🇳 Sénégal",     date:"25 Juin", time:"20h00", venue:"BMO Field",           city:"Toronto",       sn:true },
    { t1:"🇫🇷 France",    t2:"🇳🇴 Norvège",     date:"25 Juin", time:"20h00", venue:"Gillette Stadium",    city:"Boston" },
  ]},
  { group:"E", color:"#FF1744", teams:["🇪🇸 Espagne","🇵🇹 Portugal","🇲🇦 Maroc","🇺🇾 Uruguay"], matches:[
    { t1:"🇪🇸 Espagne",   t2:"🇺🇾 Uruguay",     date:"12 Juin", time:"16h00", venue:"Mercedes-Benz",       city:"Atlanta" },
    { t1:"🇵🇹 Portugal",  t2:"🇲🇦 Maroc",       date:"12 Juin", time:"19h00", venue:"Lincoln Financial",   city:"Philadelphie" },
    { t1:"🇲🇦 Maroc",     t2:"🇪🇸 Espagne",     date:"17 Juin", time:"19h00", venue:"Arrowhead Stadium",   city:"Kansas City" },
    { t1:"🇺🇾 Uruguay",   t2:"🇵🇹 Portugal",    date:"17 Juin", time:"22h00", venue:"Lumen Field",         city:"Seattle" },
    { t1:"🇺🇾 Uruguay",   t2:"🇲🇦 Maroc",       date:"22 Juin", time:"20h00", venue:"SoFi Stadium",        city:"Los Angeles" },
    { t1:"🇵🇹 Portugal",  t2:"🇪🇸 Espagne",     date:"22 Juin", time:"20h00", venue:"MetLife Stadium",     city:"New York" },
  ]},
  { group:"F", color:"#2979FF", teams:["🇧🇷 Brésil","🇨🇴 Colombie","🇭🇷 Croatie","🇨🇦 Canada"], matches:[
    { t1:"🇧🇷 Brésil",    t2:"🇨🇦 Canada",      date:"13 Juin", time:"22h00", venue:"AT&T Stadium",        city:"Dallas" },
    { t1:"🇨🇴 Colombie",  t2:"🇭🇷 Croatie",     date:"14 Juin", time:"16h00", venue:"Levi's Stadium",      city:"San Francisco" },
    { t1:"🇨🇦 Canada",    t2:"🇨🇴 Colombie",    date:"18 Juin", time:"16h00", venue:"BMO Field",           city:"Toronto" },
    { t1:"🇧🇷 Brésil",    t2:"🇭🇷 Croatie",     date:"18 Juin", time:"22h00", venue:"Rose Bowl",           city:"Los Angeles" },
    { t1:"🇨🇦 Canada",    t2:"🇭🇷 Croatie",     date:"23 Juin", time:"20h00", venue:"BMO Field",           city:"Toronto" },
    { t1:"🇨🇴 Colombie",  t2:"🇧🇷 Brésil",      date:"23 Juin", time:"20h00", venue:"Mercedes-Benz",       city:"Atlanta" },
  ]},
  { group:"G", color:"#F5C518", teams:["🇩🇰 Danemark","🇧🇪 Belgique","🇦🇺 Australie","🇨🇷 Costa Rica"], matches:[
    { t1:"🇩🇰 Danemark",  t2:"🇨🇷 Costa Rica",  date:"14 Juin", time:"19h00", venue:"SoFi Stadium",        city:"Los Angeles" },
    { t1:"🇧🇪 Belgique",  t2:"🇦🇺 Australie",   date:"14 Juin", time:"22h00", venue:"Arrowhead Stadium",   city:"Kansas City" },
    { t1:"🇦🇺 Australie", t2:"🇩🇰 Danemark",    date:"18 Juin", time:"16h00", venue:"Gillette Stadium",    city:"Boston" },
    { t1:"🇨🇷 Costa Rica",t2:"🇧🇪 Belgique",    date:"18 Juin", time:"19h00", venue:"Lincoln Financial",   city:"Philadelphie" },
    { t1:"🇦🇺 Australie", t2:"🇨🇷 Costa Rica",  date:"23 Juin", time:"20h00", venue:"AT&T Stadium",        city:"Dallas" },
    { t1:"🇧🇪 Belgique",  t2:"🇩🇰 Danemark",    date:"23 Juin", time:"20h00", venue:"MetLife Stadium",     city:"New York" },
  ]},
  { group:"H", color:"#D500F9", teams:["🇵🇱 Pologne","🇳🇱 Pays-Bas","🇸🇦 Arabie Saoudite","🇨🇮 Côte d'Ivoire"], matches:[
    { t1:"🇳🇱 Pays-Bas",  t2:"🇵🇱 Pologne",     date:"14 Juin", time:"16h00", venue:"Estadio Azteca",      city:"Mexico City" },
    { t1:"🇸🇦 Arabie S.", t2:"🇨🇮 Côte d'Ivoire",date:"15 Juin", time:"16h00", venue:"Estadio BBVA",       city:"Monterrey" },
    { t1:"🇵🇱 Pologne",   t2:"🇸🇦 Arabie S.",   date:"19 Juin", time:"16h00", venue:"Rose Bowl",           city:"Los Angeles" },
    { t1:"🇳🇱 Pays-Bas",  t2:"🇨🇮 Côte d'Ivoire",date:"19 Juin", time:"22h00", venue:"AT&T Stadium",       city:"Dallas" },
    { t1:"🇵🇱 Pologne",   t2:"🇨🇮 Côte d'Ivoire",date:"24 Juin", time:"20h00", venue:"Arrowhead Stadium",  city:"Kansas City" },
    { t1:"🇸🇦 Arabie S.", t2:"🇳🇱 Pays-Bas",    date:"24 Juin", time:"20h00", venue:"Levi's Stadium",     city:"San Francisco" },
  ]},
  { group:"I", color:"#00E5FF", teams:["🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre","🇮🇷 Iran","🇳🇬 Nigeria","🇰🇷 Corée du Sud"], matches:[
    { t1:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre",t2:"🇮🇷 Iran",      date:"15 Juin", time:"19h00", venue:"Mercedes-Benz",       city:"Atlanta" },
    { t1:"🇳🇬 Nigeria",   t2:"🇰🇷 Corée du Sud",date:"15 Juin", time:"22h00", venue:"SoFi Stadium",        city:"Los Angeles" },
    { t1:"🇮🇷 Iran",      t2:"🇳🇬 Nigeria",     date:"19 Juin", time:"16h00", venue:"Gillette Stadium",    city:"Boston" },
    { t1:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre",t2:"🇰🇷 Corée du Sud",date:"19 Juin", time:"19h00", venue:"MetLife Stadium",     city:"New York" },
    { t1:"🇮🇷 Iran",      t2:"🇰🇷 Corée du Sud",date:"24 Juin", time:"20h00", venue:"Lumen Field",         city:"Seattle" },
    { t1:"🇳🇬 Nigeria",   t2:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre",date:"24 Juin", time:"20h00", venue:"Lincoln Financial",   city:"Philadelphie" },
  ]},
  { group:"J", color:"#FF6D00", teams:["🇮🇹 Italie","🇯🇵 Japon","🇪🇬 Égypte","🇺🇦 Ukraine"], matches:[
    { t1:"🇮🇹 Italie",    t2:"🇺🇦 Ukraine",     date:"13 Juin", time:"16h00", venue:"Lincoln Financial",   city:"Philadelphie" },
    { t1:"🇯🇵 Japon",     t2:"🇪🇬 Égypte",      date:"13 Juin", time:"19h00", venue:"BMO Field",           city:"Toronto" },
    { t1:"🇪🇬 Égypte",    t2:"🇮🇹 Italie",      date:"17 Juin", time:"16h00", venue:"Mercedes-Benz",       city:"Atlanta" },
    { t1:"🇺🇦 Ukraine",   t2:"🇯🇵 Japon",       date:"17 Juin", time:"19h00", venue:"Arrowhead Stadium",   city:"Kansas City" },
    { t1:"🇪🇬 Égypte",    t2:"🇺🇦 Ukraine",     date:"21 Juin", time:"20h00", venue:"Estadio Akron",       city:"Guadalajara" },
    { t1:"🇯🇵 Japon",     t2:"🇮🇹 Italie",      date:"21 Juin", time:"20h00", venue:"Rose Bowl",           city:"Los Angeles" },
  ]},
  { group:"K", color:"#10b981", teams:["🇫🇷 France","🇵🇹 Portugal","🇩🇰 Danemark","🇨🇲 Cameroun"], matches:[
    { t1:"🇫🇷 France",    t2:"🇨🇲 Cameroun",    date:"14 Juin", time:"22h00", venue:"Lumen Field",         city:"Seattle" },
    { t1:"🇵🇹 Portugal",  t2:"🇩🇰 Danemark",    date:"15 Juin", time:"22h00", venue:"AT&T Stadium",        city:"Dallas" },
    { t1:"🇨🇲 Cameroun",  t2:"🇩🇰 Danemark",    date:"19 Juin", time:"22h00", venue:"Estadio BBVA",        city:"Monterrey" },
    { t1:"🇫🇷 France",    t2:"🇵🇹 Portugal",    date:"20 Juin", time:"16h00", venue:"MetLife Stadium",     city:"New York" },
    { t1:"🇩🇰 Danemark",  t2:"🇫🇷 France",      date:"25 Juin", time:"20h00", venue:"Gillette Stadium",    city:"Boston" },
    { t1:"🇨🇲 Cameroun",  t2:"🇵🇹 Portugal",    date:"25 Juin", time:"20h00", venue:"Mercedes-Benz",       city:"Atlanta" },
  ]},
  { group:"L", color:"#dc2626", teams:["🇧🇪 Belgique","🇩🇪 Allemagne","🇹🇷 Turquie","🇲🇦 Maroc"], matches:[
    { t1:"🇧🇪 Belgique",  t2:"🇲🇦 Maroc",       date:"16 Juin", time:"16h00", venue:"Estadio Akron",       city:"Guadalajara" },
    { t1:"🇩🇪 Allemagne", t2:"🇹🇷 Turquie",     date:"16 Juin", time:"19h00", venue:"AT&T Stadium",        city:"Dallas" },
    { t1:"🇹🇷 Turquie",   t2:"🇧🇪 Belgique",    date:"21 Juin", time:"16h00", venue:"Levi's Stadium",      city:"San Francisco" },
    { t1:"🇲🇦 Maroc",     t2:"🇩🇪 Allemagne",   date:"21 Juin", time:"19h00", venue:"Arrowhead Stadium",   city:"Kansas City" },
    { t1:"🇹🇷 Turquie",   t2:"🇲🇦 Maroc",       date:"25 Juin", time:"20h00", venue:"Lincoln Financial",   city:"Philadelphie" },
    { t1:"🇧🇪 Belgique",  t2:"🇩🇪 Allemagne",   date:"25 Juin", time:"20h00", venue:"SoFi Stadium",        city:"Los Angeles" },
  ]},
];

/* ══ TABLEAU ÉLIMINATOIRE FIFA CDM 2026 ══ */
const KNOCKOUT_BRACKET = [
  { round:"8e de finale", date:"28 Jun – 3 Jul", matches:[
    { id:"r16_1",  slot1:"1A", slot2:"2C",      date:"28 Juin", time:"20h00", venue:"Kansas City" },
    { id:"r16_2",  slot1:"1C", slot2:"3A/B/F",  date:"28 Juin", time:"23h00", venue:"Dallas" },
    { id:"r16_3",  slot1:"1B", slot2:"3A/C/D",  date:"29 Juin", time:"20h00", venue:"Los Angeles" },
    { id:"r16_4",  slot1:"1D", slot2:"3B/E/F",  date:"29 Juin", time:"23h00", venue:"New York" },
    { id:"r16_5",  slot1:"1E", slot2:"3C/D/E",  date:"30 Juin", time:"20h00", venue:"Miami" },
    { id:"r16_6",  slot1:"1G", slot2:"2H",      date:"30 Juin", time:"23h00", venue:"Seattle" },
    { id:"r16_7",  slot1:"1F", slot2:"3D/E/F",  date:"1 Juil",  time:"20h00", venue:"Boston" },
    { id:"r16_8",  slot1:"1H", slot2:"2G",      date:"1 Juil",  time:"23h00", venue:"San Francisco" },
    { id:"r16_9",  slot1:"2A", slot2:"2B",      date:"2 Juil",  time:"20h00", venue:"Atlanta" },
    { id:"r16_10", slot1:"1I", slot2:"2J",      date:"2 Juil",  time:"23h00", venue:"Philadelphie" },
    { id:"r16_11", slot1:"1J", slot2:"2I",      date:"3 Juil",  time:"20h00", venue:"Toronto" },
    { id:"r16_12", slot1:"1K", slot2:"2L",      date:"3 Juil",  time:"23h00", venue:"Guadalajara" },
    { id:"r16_13", slot1:"1L", slot2:"2K",      date:"4 Juil",  time:"20h00", venue:"Monterrey" },
    { id:"r16_14", slot1:"2D", slot2:"2E",      date:"4 Juil",  time:"23h00", venue:"Mexico City" },
    { id:"r16_15", slot1:"1F", slot2:"2F",      date:"5 Juil",  time:"20h00", venue:"Los Angeles" },
    { id:"r16_16", slot1:"2J", slot2:"2K",      date:"5 Juil",  time:"23h00", venue:"Dallas" },
  ]},
  { round:"Quarts de finale", date:"9 – 11 Jul", matches:[
    { id:"qf1", slot1:"W R16-1", slot2:"W R16-2", date:"9 Juil",  time:"20h00", venue:"Los Angeles" },
    { id:"qf2", slot1:"W R16-3", slot2:"W R16-4", date:"9 Juil",  time:"23h00", venue:"Kansas City" },
    { id:"qf3", slot1:"W R16-5", slot2:"W R16-6", date:"10 Juil", time:"20h00", venue:"Dallas" },
    { id:"qf4", slot1:"W R16-7", slot2:"W R16-8", date:"10 Juil", time:"23h00", venue:"New York" },
    { id:"qf5", slot1:"W R16-9", slot2:"W R16-10",date:"11 Juil", time:"20h00", venue:"Atlanta" },
    { id:"qf6", slot1:"W R16-11",slot2:"W R16-12",date:"11 Juil", time:"23h00", venue:"San Francisco" },
    { id:"qf7", slot1:"W R16-13",slot2:"W R16-14",date:"12 Juil", time:"20h00", venue:"Seattle" },
    { id:"qf8", slot1:"W R16-15",slot2:"W R16-16",date:"12 Juil", time:"23h00", venue:"Boston" },
  ]},
  { round:"Demi-finales", date:"15 – 16 Jul", matches:[
    { id:"sf1", slot1:"W QF1", slot2:"W QF2", date:"15 Juil", time:"20h00", venue:"Dallas" },
    { id:"sf2", slot1:"W QF3", slot2:"W QF4", date:"15 Juil", time:"23h00", venue:"Los Angeles" },
    { id:"sf3", slot1:"W QF5", slot2:"W QF6", date:"16 Juil", time:"20h00", venue:"Atlanta" },
    { id:"sf4", slot1:"W QF7", slot2:"W QF8", date:"16 Juil", time:"23h00", venue:"New York" },
  ]},
  { round:"Finale 🏆", date:"19 Juil", matches:[
    { id:"final", slot1:"W SF1/SF2", slot2:"W SF3/SF4", date:"19 Juil", time:"21h00", venue:"MetLife Stadium, New York" },
  ]},
];

const WC_TIMELINE = [
  { year:1930, flag:"🇺🇾", host:"Uruguay",    winner:"Uruguay 🇺🇾",   score:"4–2 Argentine",       color:"#06b6d4", senegal:false,
    headline:"La naissance d'un mythe", topScorer:"Stábile 🇦🇷 — 8 buts",
    story:"Jules Rimet rêvait d'un tournoi mondial. 13 nations, 93 000 spectateurs au Centenario. La Celeste écrase l'Argentine. Le football mondial venait de naître.",
    moment:"Le but de Castro, amputé d'un bras, scelle le 4-2. L'Uruguay danse toute la nuit.",
    stats:{ teams:13, goals:70, avg:"3.9", att:"93 000" } },
  { year:1950, flag:"🇧🇷", host:"Brésil",     winner:"Uruguay 🇺🇾",   score:"2–1 Brésil",          color:"#ef4444", senegal:false,
    headline:"Le Maracanazo — La tragédie absolue", topScorer:"Ademir 🇧🇷 — 9 buts",
    story:"200 000 Brésiliens au Maracanã. Le Brésil n'a besoin que d'un nul. Ghiggia longe la ligne, trompe Barbosa. Silence de mort. Des spectateurs meurent de crise cardiaque.",
    moment:"\"Seuls trois personnes ont fait taire le Maracanã : Sinatra, le Pape, et moi.\" — Ghiggia",
    stats:{ teams:13, goals:88, avg:"4.0", att:"199 854" } },
  { year:1958, flag:"🇸🇪", host:"Suède",      winner:"Brésil 🇧🇷",    score:"5–2 Suède",           color:A.gold,    senegal:false,
    headline:"Pelé, 17 ans — Un dieu est né", topScorer:"Fontaine 🇫🇷 — 13 buts ⚡ RECORD ÉTERNEL",
    story:"Un gamin pleure en finale. Just Fontaine inscrit 13 buts en 6 matchs — record peut-être éternel. Le football ne sera plus jamais pareil.",
    moment:"Pelé saute dans les bras de Didi. Ses larmes en direct mondial pour la première fois à la TV couleur.",
    stats:{ teams:16, goals:126, avg:"3.6", att:"51 800" } },
  { year:1970, flag:"🇲🇽", host:"Mexique",    winner:"Brésil 🇧🇷",    score:"4–1 Italie",          color:A.gold,    senegal:false,
    headline:"Le plus beau football jamais joué", topScorer:"Müller 🇩🇪 — 10 buts",
    story:"Pelé, Jairzinho, Rivelino, Tostão. L'équipe la plus belle de l'histoire. Carlos Alberto clôture sur une frappe de légende après 10 passes consécutives.",
    moment:"La passe aveugle de Pelé pour Carlos Alberto. Le but le plus beau de toute l'histoire du football.",
    stats:{ teams:16, goals:95, avg:"3.0", att:"107 160" } },
  { year:1986, flag:"🇲🇽", host:"Mexique",    winner:"Argentine 🇦🇷", score:"3–2 Allemagne",       color:"#06b6d4", senegal:false,
    headline:"Maradona — Dieu et Diable en un seul homme", topScorer:"Lineker 🏴󠁧󠁢󠁥󠁮󠁧󠁿 — 6 buts",
    story:"Minute 51 : la Main de Dieu. Minute 55 : 60 mètres, 5 Anglais dribblés. Le plus beau but de l'histoire. Deux buts. Deux visages de l'humanité.",
    moment:"\"Un peu avec la tête de Maradona et un peu avec la main de Dieu.\" Cynisme érigé en légende.",
    stats:{ teams:24, goals:132, avg:"2.5", att:"114 600" } },
  { year:1994, flag:"🇺🇸", host:"USA",        winner:"Brésil 🇧🇷",    score:"0–0 Italie (3–2 tab)",color:"#ef4444", senegal:false,
    headline:"Baggio manque — Le Brésil pleure de joie", topScorer:"Salenko 🇷🇺 — 6 buts",
    story:"Baggio porte l'Italie à la finale seul. Tirs au but. Il s'avance, le dernier. Il tire. Le ballon s'envole dans le ciel californien. Il baisse la tête.",
    moment:"\"Le penalty manqué me suivra jusqu'à ma mort.\" — Roberto Baggio",
    stats:{ teams:24, goals:141, avg:"2.7", att:"94 194" } },
  { year:1998, flag:"🇫🇷", host:"France",     winner:"France 🇫🇷",    score:"3–0 Brésil",          color:A.blue,    senegal:false,
    headline:"Zidane roi. Ronaldo mystère.", topScorer:"Šuker 🇭🇷 — 6 buts",
    story:"La veille, Ronaldo convulse. Mystère total. Zidane marque deux têtes. 1 million de personnes sur les Champs-Élysées. Zizou projeté sur l'Arc de Triomphe.",
    moment:"La France multiraciale célèbre son unité. La nuit la plus belle du football français.",
    stats:{ teams:32, goals:171, avg:"2.7", att:"80 000" } },
  { year:2002, flag:"🇰🇷", host:"Corée/Japon",winner:"Brésil 🇧🇷",    score:"2–0 Allemagne",       color:A.green,   senegal:true,
    headline:"🦁 LE SÉNÉGAL CHOQUE L'UNIVERS", topScorer:"Ronaldo 🇧🇷 — 8 buts",
    story:"31 mai 2002. Séoul. Papa Bouba Diop, les fesses dans l'herbe, pousse du pied gauche dans le but de Barthez. La France championne du monde éliminée dès les groupes. Le Sénégal en quarts. L'Afrique pleure de joie.",
    moment:"La célébration au drapeau. Les Lions dansent. Tout un continent en liesse. Le plus grand moment du football africain.",
    stats:{ teams:32, goals:161, avg:"2.5", att:"69 029" },
    lionsMoments:[
      { vs:"🇫🇷 France",   result:"V 1–0", icon:"⚡", scorers:"Papa Bouba Diop 30'", shots:6,  poss:38, passes:312, story:"LE BUT QUI A CHANGÉ L'AFRIQUE. Assist El Hadji Diouf. Tirs : 6. Possession : 38%." },
      { vs:"🇩🇰 Danemark", result:"N 1–1", icon:"🤝", scorers:"Salif Diao 52'",      shots:8,  poss:44, passes:378, story:"Solidité défensive. Maîtrise collective. Lions en construction." },
      { vs:"🇺🇾 Uruguay",  result:"N 3–3", icon:"🎭", scorers:"Diop 20', 26', Fadiga 68'", shots:11, poss:47, passes:421, story:"Thriller absolu. Qualification arrachée au drama." },
      { vs:"🇸🇪 Suède",    result:"V 2–1", icon:"🔥", scorers:"H. Camara 37', 104'", shots:9,  poss:45, passes:398, story:"Camara en prolongations. 8e de finale. Lions magnifiques." },
      { vs:"🇹🇷 Turquie",  result:"D 0–1", icon:"💔", scorers:"—",                   shots:7,  poss:46, passes:389, story:"But en or d'Ilhan. Rêve brisé en quart. L'histoire est déjà écrite." },
    ]},
  { year:2006, flag:"🇩🇪", host:"Allemagne",  winner:"Italie 🇮🇹",    score:"1–1 France (5–3 tab)",color:A.blue,    senegal:false,
    headline:"Zidane — Le dernier geste d'une légende", topScorer:"Klose 🇩🇪 — 5 buts",
    story:"Finale. 110e minute. Materazzi chuchote. Zidane se retourne. Frappe. Carton rouge. Sa dernière action en football professionnel.",
    moment:"Zidane marche vers les vestiaires, tête haute, devant le trophée qu'il ne touchera jamais.",
    stats:{ teams:32, goals:147, avg:"2.3", att:"69 000" } },
  { year:2010, flag:"🇿🇦", host:"Afr. du Sud",winner:"Espagne 🇪🇸",   score:"1–0 Pays-Bas a.p.",   color:A.orange,  senegal:false,
    headline:"L'Afrique accueille le monde", topScorer:"T. Müller 🇩🇪 — 5 buts",
    story:"Premier Mondial africain. Les vuvuzelas. Paul l'octopus. Iniesta à la 116e minute. La Roja tiki-taka change le football.",
    moment:"Iniesta dédie son but à son ami Dani Jarque, mort deux mois plus tôt. Football et humanité.",
    stats:{ teams:32, goals:145, avg:"2.3", att:"84 490" } },
  { year:2014, flag:"🇧🇷", host:"Brésil",     winner:"Allemagne 🇩🇪", score:"1–0 Argentine a.p.",  color:A.gold,    senegal:false,
    headline:"7–1 : L'humiliation d'un peuple entier", topScorer:"J. Rodríguez 🇨🇴 — 6 buts",
    story:"En 29 minutes : 5-0. Les supporters brésiliens pleurent en direct. Le 7-1 final. Le \"Mineirazo\". La plus grande humiliation de l'histoire.",
    moment:"Le 5e but à la 29e. Un enfant pleure. Une femme s'effondre. Les caméras cadrent les visages.",
    stats:{ teams:32, goals:171, avg:"2.7", att:"74 738" } },
  { year:2018, flag:"🇷🇺", host:"Russie",     winner:"France 🇫🇷",    score:"4–2 Croatie",         color:A.red,     senegal:true,
    headline:"🦁 Sénégal — L'injustice absolue", topScorer:"Kane 🏴󠁧󠁢󠁥󠁮󠁧󠁿 — 6 buts",
    story:"Égalité parfaite avec le Japon. La FIFA applique la règle du fair-play. 1 carton jaune de plus. Éliminé. La règle la plus injuste jamais appliquée dans l'histoire du sport.",
    moment:"Aliou Cissé pleure dans le couloir. Un carton jaune de trop. Une génération brisée.",
    stats:{ teams:32, goals:169, avg:"2.6", att:"78 011" },
    lionsMoments:[
      { vs:"🇵🇱 Pologne",   result:"V 2–1", icon:"✅", scorers:"Mbaye Niang 37', 60'", shots:12, poss:48, passes:445, story:"Niang impérial. Mané brillant. Victoire nette." },
      { vs:"🇯🇵 Japon",     result:"N 2–2", icon:"😤", scorers:"Mané 71', Wagué 78'",  shots:10, poss:45, passes:401, story:"Drama total. Qualification semblait assurée." },
      { vs:"🇨🇴 Colombie",  result:"D 0–1", icon:"😭", scorers:"—",                   shots:9,  poss:42, passes:389, story:"Défaite et élimination par fair-play. L'injustice absolue." },
    ]},
  { year:2022, flag:"🇶🇦", host:"Qatar",      winner:"Argentine 🇦🇷", score:"3–3 France (4–2 tab)",color:A.purple,  senegal:true,
    headline:"🦁 Sénégal en 8e. La finale la plus épique.", topScorer:"Mbappé 🇫🇷 — 8 buts",
    story:"La finale la plus folle. 2-0. Mbappé 2 buts en 1 minute : 2-2. 3-3 en prolongation. Tirs au but. Messi soulève enfin le trophée à 35 ans. Le Sénégal sans Mané avait atteint les 8e.",
    moment:"Messi pleure en soulevant le trophée. 4 finales perdues. Champion à 35 ans. L'histoire complète.",
    stats:{ teams:32, goals:172, avg:"2.7", att:"88 966" },
    lionsMoments:[
      { vs:"🇳🇱 Pays-Bas",  result:"D 0–2", icon:"😬", scorers:"—",                          shots:8,  poss:40, passes:356, story:"Défaite mais combativité. Sans Mané." },
      { vs:"🇶🇦 Qatar",     result:"V 3–1", icon:"🔥", scorers:"Dia 41', Dieng 48', Bamb. 84'", shots:15, poss:55, passes:512, story:"Koulibaly capitaine impérial. Lions sublimes." },
      { vs:"🇪🇨 Équateur",  result:"V 2–1", icon:"⚡", scorers:"Koulibaly 70', Dia 73'",       shots:13, poss:51, passes:489, story:"Qualification arrachée en fin de match." },
      { vs:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre",result:"D 0–3",icon:"💔", scorers:"—",                          shots:7,  poss:38, passes:334, story:"Sans Mané, trop visible. Fin du voyage, tête haute." },
    ]},
];

const LEGENDS_DATA = [
  { rank:1, name:"Miroslav Klose",  country:"🇩🇪", goals:16, matches:24, ratio:0.67, era:"2002–2014", color:A.gold,   badge:"RECORD ABSOLU",    desc:"4 Mondiaux. Champion 2014. Record peut-être éternel." },
  { rank:2, name:"Ronaldo Nazário", country:"🇧🇷", goals:15, matches:19, ratio:0.79, era:"1994–2006", color:A.green,  badge:"R9 · PHÉNOMÈNE",   desc:"Double champion. Meilleur buteur 1998 et 2002." },
  { rank:3, name:"Gerd Müller",     country:"🇩🇪", goals:14, matches:13, ratio:1.08, era:"1970–1974", color:A.orange, badge:"DER BOMBER",        desc:"14 buts en 13 matchs. 10 buts lors du Mondial 1970 seul." },
  { rank:4, name:"Just Fontaine",   country:"🇫🇷", goals:13, matches:6,  ratio:2.17, era:"1958",      color:A.red,    badge:"13 EN 6 MATCHS",   desc:"1 seul Mondial. Record d'une édition jamais battu depuis 66 ans." },
  { rank:5, name:"Lionel Messi",    country:"🇦🇷", goals:13, matches:26, ratio:0.50, era:"2006–2022", color:A.purple, badge:"CHAMPION 2022",     desc:"5 Mondiaux. Champion à 35 ans. 8 passes décisives — double record." },
  { rank:6, name:"Kylian Mbappé",   country:"🇫🇷", goals:12, matches:14, ratio:0.86, era:"2018–2022", color:A.blue,   badge:"FUTUR RECORD ?",   desc:"Champion à 19 ans. Triplé en finale 2022. Favori pour battre Klose." },
  { rank:7, name:"Pelé",            country:"🇧🇷", goals:12, matches:14, ratio:0.86, era:"1958–1970", color:A.gold,   badge:"LE ROI",            desc:"Triple champion. 1er but en finale à 17 ans." },
];

const SENEGAL_HEROES = [
  { name:"Papa Bouba Diop",  pos:"Milieu défensif", club:"RC Lens",        years:"2002",       goals:3, emoji:"⚡", quote:"Le but qui a changé l'Afrique pour toujours.", stats:["3 buts en 5 matchs","MVP Sénégalais 2002","Décédé 2020 — Légende éternelle"] },
  { name:"El Hadji Diouf",   pos:"Attaquant",       club:"Lens → Liverpool",years:"2002–2006", goals:2, emoji:"🦅", quote:"MVP France-Sénégal. La passe qui a tout déclenché.", stats:["Meilleur africain 2001, 2002","4 passes décisives en 2002","Âme technique de l'épopée"] },
  { name:"Sadio Mané",       pos:"Ailier gauche",   club:"Liverpool → Bayern",years:"2018–2022",goals:2, emoji:"🌟", quote:"Champion d'Afrique 2021. Notre capitaine, notre âme.", stats:["Ballon d'Or africain 2019, 2022","Top 10 mondial 4 ans","Blessé en 2022 — Lions ont quand même brillé"] },
  { name:"Kalidou Koulibaly",pos:"Défenseur central",club:"Napoli → Chelsea",years:"2018–2022",goals:2, emoji:"🛡️", quote:"Capitaine 2022. But qualificatif vs Équateur. Mur absolu.", stats:["Duels gagnés : 74% en 2022","Meilleur défenseur africain 2021","Pilier 8 ans en sélection"] },
  { name:"Aliou Cissé",      pos:"Milieu → Coach",  club:"Birmingham → Sélectionneur",years:"2002+",goals:0, emoji:"👑", quote:"Capitaine 2002. Coach CAN 2021. L'âme des Lions depuis 24 ans.", stats:["Capitaine du choc France 2002","CAN 2021 : 1er titre sénégalais","Coach Mondial 2026"] },
];

const PRONOSTICS_MATCHES = [
  { id:"p1", t1:"🇸🇳 Sénégal", t2:"🇫🇷 France",    date:"16 Juin", pts:30, locked:false },
  { id:"p2", t1:"🇧🇷 Brésil",  t2:"🇩🇪 Allemagne", date:"12 Juin", pts:20, locked:false },
  { id:"p3", t1:"🇦🇷 Argentine",t2:"🇪🇸 Espagne",  date:"13 Juin", pts:20, locked:false },
  { id:"p4", t1:"🇳🇴 Norvège", t2:"🇸🇳 Sénégal",   date:"22 Juin", pts:25, locked:false },
  { id:"p5", t1:"🇲🇽 Mexique", t2:"🇿🇦 Afr. Sud",  date:"11 Juin", pts:15, locked:true, result:"t1" },
];

const LEADERBOARD = [
  { rank:1, name:"Mamadou D.", pts:1840, flag:"🇸🇳", trend:"↑" },
  { rank:2, name:"Awa S.",     pts:1720, flag:"🇸🇳", trend:"↑" },
  { rank:3, name:"Ibrahima F.",pts:1650, flag:"🇸🇳", trend:"→" },
  { rank:4, name:"Fatou N.",   pts:1590, flag:"🇸🇳", trend:"↑" },
  { rank:5, name:"Cheikh M.",  pts:1480, flag:"🇸🇳", trend:"↓" },
];

const NEWS_DATA = [
  { tag:"BREAKING",    title:"Sadio Mané : \"Je suis à 100% pour affronter la France\"",      time:"Il y a 30min", emoji:"🦁", color:A.green },
  { tag:"EXCLUSIF",    title:"El Hadji Diouf : \"2026 est notre finale. On va gagner.\"",     time:"Il y a 2h",   emoji:"⚡", color:A.gold },
  { tag:"GPT-LIONS",   title:"IA : 63% de victoire Sénégal — 47 variables analysées",         time:"Il y a 4h",   emoji:"🤖", color:A.blue },
  { tag:"HISTOIRE",    title:"31 mai 2002 : Papa Bouba Diop changeait l'Afrique à jamais",   time:"Il y a 6h",   emoji:"🕊️", color:"#8888AA" },
  { tag:"MONDIAL 2026",title:"104 matchs, 48 équipes — l'histoire s'écrit maintenant",        time:"Il y a 1 jour",emoji:"🏆", color:A.purple },
];

/* ══ CLAUDE AI ══ */
const DATA_CONFIG = {
  API_FOOTBALL_KEY: "",
  API_FOOTBALL_HOST: "v3.football.api-sports.io",
  FOOTBALL_DATA_KEY: "1c977bce952c48e18140ca4307bf2899",
  WC_2026_ID: 1,
  SENEGAL_ID: 537,
};

async function fetchLiveScores() {
  if (!DATA_CONFIG.API_FOOTBALL_KEY) return null;
  try {
    const res = await fetch(
      `https://${DATA_CONFIG.API_FOOTBALL_HOST}/fixtures?live=all&league=${DATA_CONFIG.WC_2026_ID}`,
      { headers: { "x-rapidapi-key": DATA_CONFIG.API_FOOTBALL_KEY, "x-rapidapi-host": DATA_CONFIG.API_FOOTBALL_HOST } }
    );
    const d = await res.json();
    return d.response || null;
  } catch { return null; }
}

async function fetchRealTimeMatches() {
  if (!DATA_CONFIG.FOOTBALL_DATA_KEY) return null;
  try {
    const [liveRes, upcomingRes] = await Promise.all([
      fetch("https://api.football-data.org/v4/competitions/WC/matches?status=LIVE", { headers: { "X-Auth-Token": DATA_CONFIG.FOOTBALL_DATA_KEY } }),
      fetch("https://api.football-data.org/v4/competitions/WC/matches?status=IN_PLAY,PAUSED", { headers: { "X-Auth-Token": DATA_CONFIG.FOOTBALL_DATA_KEY } })
    ]);
    const live = liveRes.ok ? await liveRes.json() : { matches: [] };
    const inplay = upcomingRes.ok ? await upcomingRes.json() : { matches: [] };
    return [...(live.matches || []), ...(inplay.matches || [])];
  } catch { return null; }
}

async function fetchUpcomingMatches() {
  if (!DATA_CONFIG.FOOTBALL_DATA_KEY) return null;
  try {
    const res = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches?status=SCHEDULED",
      { headers: { "X-Auth-Token": DATA_CONFIG.FOOTBALL_DATA_KEY } }
    );
    if (!res.ok) return null;
    const d = await res.json();
    return (d.matches || []).slice(0, 5);
  } catch { return null; }
}

async function fetchTopScorers(leagueId = DATA_CONFIG.WC_2026_ID, season = 2026) {
  if (!DATA_CONFIG.API_FOOTBALL_KEY) return null;
  try {
    const res = await fetch(
      `https://${DATA_CONFIG.API_FOOTBALL_HOST}/players/topscorers?league=${leagueId}&season=${season}`,
      { headers: { "x-rapidapi-key": DATA_CONFIG.API_FOOTBALL_KEY, "x-rapidapi-host": DATA_CONFIG.API_FOOTBALL_HOST } }
    );
    const d = await res.json();
    return d.response || null;
  } catch { return null; }
}

async function askClaude(messages, system) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system, messages })
    });
    const d = await res.json();
    return d.content?.[0]?.text || "Erreur de connexion.";
  } catch { return "❌ Connexion impossible. Réessaie dans un instant."; }
}

const AI_SYSTEM = "Tu es GPT-LIONS, l'IA officielle de Lions Arena 2026. Tu analyses les matchs avec passion et expertise. Tu parles en francais. Reponds en 3-5 phrases avec emojis football. Stats: Klose 16 buts record. Senegal bat France 1-0 en 2002 (Papa Bouba Diop). Prediction 2026: 63% Senegal.";

/* ══ SMALL UTILS ══ */
function Dot({ color=A.red, size=9 }) {
  return (
    <span style={{ position:"relative", display:"inline-block", width:size, height:size }}>
      <span style={{ position:"absolute", inset:0, borderRadius:"50%", background:color, animation:"ping 1.5s ease-in-out infinite" }} />
      <span style={{ position:"absolute", inset:0, borderRadius:"50%", background:color }} />
    </span>
  );
}

function Bar({ value, max, color, T, h=5 }) {
  return (
    <div style={{ height:h, borderRadius:h/2, background:T.border, overflow:"hidden" }}>
      <div style={{ height:"100%", borderRadius:h/2, width:`${Math.min((value/max)*100,100)}%`, background:`linear-gradient(90deg,${color}66,${color})`, transition:"width 1s ease" }} />
    </div>
  );
}

/* ══ CINEMATIC INTRO ══ */
const CINEMATIC_FRAMES = [
  { word:"GAINDÉ",      sub:"Lion en Wolof",              color:"#F5C518", size:64, bg:"#05050A" },
  { word:"GALSEN",      sub:"Sénégal · L'âme du foot",    color:"#00C853", size:64, bg:"#020A04" },
  { word:"2002",        sub:"Le but qui a changé l'Afrique", color:"#00C853", size:72, bg:"#020A04" },
  { word:"PAPA BOUBA",  sub:"30' · Séoul · Barthez battu", color:"#F5C518", size:48, bg:"#05050A" },
  { word:"⚽→🥅",       sub:"El Hadji Diouf · Assist légendaire", color:"#FFFFFF", size:56, bg:"#020204" },
  { word:"1–0",         sub:"France éliminée · Champions battus", color:"#FF1744", size:80, bg:"#1A0004" },
  { word:"🦁🦁🦁",     sub:"L'Afrique entière en liesse",  color:"#F5C518", size:56, bg:"#05050A" },
  { word:"2018",        sub:"Un carton jaune de trop",     color:"#FF1744", size:72, bg:"#120002" },
  { word:"2022",        sub:"Quarts · Sans Mané · Tête haute", color:"#D500F9", size:64, bg:"#080012" },
  { word:"2026",        sub:"L'année du sacre",            color:"#F5C518", size:72, bg:"#05050A" },
  { word:"CDM 2026",    sub:"USA · Canada · Mexique",      color:"#00C853", size:52, bg:"#020A04" },
  { word:"LIONS ARENA", sub:"The Living History",          color:"#F5C518", size:44, bg:"#05050A" },
];

function CinematicIntro({ onFinish }) {
  const [frame, setFrame] = useState(0);
  const [visible, setVisible] = useState(true);
  const [particles, setParticles] = useState([]);
  const totalFrames = CINEMATIC_FRAMES.length;

  useEffect(() => {
    setParticles(Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      dur: 2 + Math.random() * 3,
      delay: Math.random() * 2,
    })));
  }, []);

  useEffect(() => {
    if (frame >= totalFrames) { onFinish(); return; }
    const dur = frame === totalFrames - 1 ? 1800 : 900;
    const fadeOut = setTimeout(() => setVisible(false), dur - 280);
    const next = setTimeout(() => { setVisible(true); setFrame(f => f + 1); }, dur);
    return () => { clearTimeout(fadeOut); clearTimeout(next); };
  }, [frame]);

  if (frame >= totalFrames) return null;
  const f = CINEMATIC_FRAMES[frame];
  const progress = ((frame + 1) / totalFrames) * 100;

  return (
    <div style={{
      position:"fixed", inset:0, background:f.bg,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      overflow:"hidden", zIndex:1000,
      transition:"background 0.4s ease",
    }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position:"absolute", left:`${p.x}%`, top:`${p.y}%`,
          width:p.size, height:p.size, borderRadius:"50%",
          background:f.color, opacity:0.15,
          animation:`particleFloat ${p.dur}s ${p.delay}s ease-in-out infinite alternate`,
        }} />
      ))}
      <div style={{
        position:"absolute", inset:0,
        background:`radial-gradient(ellipse at 50% 50%, ${f.color}18 0%, transparent 65%)`,
        transition:"background 0.5s",
      }} />
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"#1A1A2E" }}>
        <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg,${f.color}88,${f.color})`, transition:"width 0.4s ease", boxShadow:`0 0 10px ${f.color}` }} />
      </div>
      <div style={{ position:"absolute", top:20, right:20, fontSize:10, color:f.color, fontFamily:"monospace", fontWeight:700, opacity:0.5, letterSpacing:2 }}>
        {String(frame+1).padStart(2,"0")}/{totalFrames}
      </div>
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background:`linear-gradient(180deg,#00853F,#FDEF42,#E31B23)`, opacity:0.6 }} />
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:4, background:`linear-gradient(180deg,#00853F,#FDEF42,#E31B23)`, opacity:0.6 }} />
      <div style={{
        textAlign:"center", padding:"0 32px",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1) translateY(0)" : "scale(0.92) translateY(12px)",
        transition:"opacity 0.25s ease, transform 0.25s ease",
      }}>
        <div style={{
          fontSize: f.size, fontWeight:900, color:f.color,
          letterSpacing: f.word.length > 8 ? -1 : 2,
          lineHeight:1.1, fontFamily:"'DM Sans',sans-serif",
          textShadow:`0 0 40px ${f.color}88, 0 0 80px ${f.color}44`,
          marginBottom:16,
        }}>
          {f.word}
        </div>
        <div style={{
          fontSize:14, color:"#C0C0D8", letterSpacing:2,
          fontWeight:600, textTransform:"uppercase",
          textShadow:`0 0 20px ${f.color}44`,
        }}>
          {f.sub}
        </div>
        <div style={{ width:60, height:2, background:f.color, margin:"20px auto 0", borderRadius:1, boxShadow:`0 0 12px ${f.color}` }} />
      </div>
      <button onClick={onFinish} style={{ position:"absolute", bottom:32, right:24, background:"transparent", border:`1px solid #2A2A3E`, color:"#4A4A6A", borderRadius:8, padding:"6px 14px", fontSize:11, cursor:"pointer", fontWeight:600, letterSpacing:1 }}>
        Passer →
      </button>
      <div style={{ position:"absolute", bottom:32, left:24, fontSize:9, color:f.color, fontFamily:"monospace", opacity:0.5, letterSpacing:2 }}>
        LIONS ARENA 2026
      </div>
    </div>
  );
}

/* ══ SPLASH / ONBOARDING ══ */
function Splash({ onDone }) {
  const [showCinema, setShowCinema] = useState(true);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [team, setTeam] = useState(null);
  const [animOut, setAnimOut] = useState(false);

  const CONFEDS = [
    { name:"🌍 AFRIQUE (CAF)", color:"#00C853", teams:[
      {flag:"🇸🇳",name:"Sénégal",hot:true},{flag:"🇲🇦",name:"Maroc"},{flag:"🇳🇬",name:"Nigeria"},
      {flag:"🇪🇬",name:"Égypte"},{flag:"🇨🇲",name:"Cameroun"},{flag:"🇬🇭",name:"Ghana"},
      {flag:"🇩🇿",name:"Algérie"},{flag:"🇹🇳",name:"Tunisie"},{flag:"🇨🇮",name:"Côte d'Ivoire"},
    ]},
    { name:"🌎 AMÉRIQUE SUD (CONMEBOL)", color:"#F5C518", teams:[
      {flag:"🇦🇷",name:"Argentine"},{flag:"🇧🇷",name:"Brésil"},{flag:"🇺🇾",name:"Uruguay"},
      {flag:"🇨🇴",name:"Colombie"},{flag:"🇪🇨",name:"Équateur"},{flag:"🇻🇪",name:"Venezuela"},
    ]},
    { name:"🌍 EUROPE (UEFA)", color:"#2979FF", teams:[
      {flag:"🇫🇷",name:"France"},{flag:"🇩🇪",name:"Allemagne"},{flag:"🇪🇸",name:"Espagne"},
      {flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",name:"Angleterre"},{flag:"🇵🇹",name:"Portugal"},{flag:"🇳🇱",name:"Pays-Bas"},
      {flag:"🇧🇪",name:"Belgique"},{flag:"🇮🇹",name:"Italie"},{flag:"🇭🇷",name:"Croatie"},
      {flag:"🇩🇰",name:"Danemark"},{flag:"🇨🇭",name:"Suisse"},{flag:"🇦🇹",name:"Autriche"},
      {flag:"🇹🇷",name:"Turquie"},{flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",name:"Écosse"},{flag:"🇷🇸",name:"Serbie"},
      {flag:"🇺🇦",name:"Ukraine"},
    ]},
    { name:"🌎 CONCACAF", color:"#FF6D00", teams:[
      {flag:"🇺🇸",name:"États-Unis"},{flag:"🇲🇽",name:"Mexique"},{flag:"🇨🇦",name:"Canada"},
      {flag:"🇨🇷",name:"Costa Rica"},{flag:"🇵🇦",name:"Panama"},{flag:"🇯🇲",name:"Jamaïque"},
    ]},
    { name:"🌏 ASIE (AFC)", color:"#D500F9", teams:[
      {flag:"🇯🇵",name:"Japon"},{flag:"🇰🇷",name:"Corée du Sud"},{flag:"🇦🇺",name:"Australie"},
      {flag:"🇮🇷",name:"Iran"},{flag:"🇸🇦",name:"Arabie Saoudite"},{flag:"🇶🇦",name:"Qatar"},
      {flag:"🇮🇶",name:"Irak"},{flag:"🇺🇿",name:"Ouzbékistan"},
    ]},
    { name:"🌊 OCÉANIE (OFC)", color:"#00E5FF", teams:[
      {flag:"🇳🇿",name:"Nouvelle-Zélande"},
    ]},
  ];

  if (showCinema) return <CinematicIntro onFinish={() => setShowCinema(false)} />;

  const next = () => {
    if(step === 0) setStep(1);
    else if(step === 1 && name.trim()) setStep(2);
    else if(step === 2 && team) { setAnimOut(true); setTimeout(()=>onDone({ name:name.trim(), team }), 500); }
  };

  const getConfColor = (teamStr) => {
    if (!teamStr) return "#F5C518";
    if (teamStr.includes("Sénégal")||teamStr.includes("Maroc")||teamStr.includes("Nigeria")||teamStr.includes("Cameroun")||teamStr.includes("Ghana")||teamStr.includes("Algérie")||teamStr.includes("Tunisie")||teamStr.includes("Côte")||teamStr.includes("Égypte")) return "#00C853";
    if (teamStr.includes("Argentine")||teamStr.includes("Brésil")||teamStr.includes("Uruguay")||teamStr.includes("Colombie")||teamStr.includes("Équateur")||teamStr.includes("Venezuela")) return "#F5C518";
    if (teamStr.includes("France")||teamStr.includes("Allemagne")||teamStr.includes("Espagne")||teamStr.includes("Angleterre")||teamStr.includes("Portugal")||teamStr.includes("Pays-Bas")||teamStr.includes("Belgique")||teamStr.includes("Italie")||teamStr.includes("Croatie")||teamStr.includes("Danemark")||teamStr.includes("Suisse")||teamStr.includes("Autriche")||teamStr.includes("Turquie")||teamStr.includes("Écosse")||teamStr.includes("Serbie")||teamStr.includes("Ukraine")) return "#2979FF";
    if (teamStr.includes("États-Unis")||teamStr.includes("Mexique")||teamStr.includes("Canada")||teamStr.includes("Costa")||teamStr.includes("Panama")||teamStr.includes("Jamaïque")) return "#FF6D00";
    if (teamStr.includes("Japon")||teamStr.includes("Corée")||teamStr.includes("Australie")||teamStr.includes("Iran")||teamStr.includes("Arabie")||teamStr.includes("Qatar")||teamStr.includes("Irak")||teamStr.includes("Ouzbékistan")) return "#D500F9";
    return "#00E5FF";
  };

  return (
    <div style={{ minHeight:"100dvh", background:"#05050A", display:"flex", flexDirection:"column", animation:animOut?"fadeOut 0.5s ease forwards":"none", overflow:"hidden" }}>
      <div style={{ position:"fixed", top:"30%", left:"50%", transform:"translateX(-50%)", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,#F5C51810,transparent 70%)", pointerEvents:"none", zIndex:0 }} />

      {step === 0 && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, animation:"fadeIn 0.5s ease" }}>
          <div style={{ fontSize:72, marginBottom:16, filter:"drop-shadow(0 0 30px #F5C51888)" }}>🦁</div>
          <div style={{ fontSize:32, fontWeight:900, color:"#F0EDE6", letterSpacing:-1, lineHeight:1.1, marginBottom:8, textAlign:"center" }}>
            LIONS <span style={{ color:"#F5C518" }}>ARENA</span>
          </div>
          <div style={{ fontSize:13, color:"#6A6A80", letterSpacing:3, marginBottom:32 }}>THE LIVING HISTORY · 2026</div>
          <div style={{ fontSize:15, color:"#A0A0B8", lineHeight:1.8, marginBottom:40, textAlign:"center" }}>
            La plus grande plateforme football jamais construite.<br/>
            L'histoire vit ici. Le Sénégal règne ici.
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24, width:"100%", maxWidth:360 }}>
            {[["🏆","Histoire du Mondial 1930→2026"],["🦁","Chaque match des Lions — stats complètes"],["🤖","IA Claude — analyses & commentaires live"],["🎯","Pronostics & classement communauté"]].map(([ico,txt],i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#0C0C14", borderRadius:12, border:"1px solid #1A1A2E" }}>
                <span style={{ fontSize:18 }}>{ico}</span>
                <span style={{ fontSize:13, color:"#C0C0D8", fontWeight:500 }}>{txt}</span>
              </div>
            ))}
          </div>
          <button onClick={next} style={{ width:"100%", maxWidth:360, padding:"16px", background:"linear-gradient(135deg,#00C853,#F5C518)", border:"none", borderRadius:14, color:"#000", fontSize:16, fontWeight:900, cursor:"pointer", boxShadow:"0 8px 30px #F5C51844" }}>
            🦁 Entrer dans l'arène
          </button>
        </div>
      )}

      {step === 1 && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, animation:"fadeIn 0.4s ease" }}>
          <div style={{ textAlign:"center", marginBottom:32, width:"100%", maxWidth:360 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>👤</div>
            <div style={{ fontSize:22, fontWeight:900, color:"#F0EDE6" }}>Comment tu t'appelles ?</div>
            <div style={{ fontSize:13, color:"#6A6A80", marginTop:6 }}>Pour personnaliser ton expérience</div>
          </div>
          <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&name.trim()&&next()} placeholder="Ton prénom ou pseudo..." autoFocus
            style={{ width:"100%", maxWidth:360, background:"#0C0C14", border:`2px solid ${name.trim()?"#F5C518":"#1A1A2E"}`, borderRadius:14, padding:"16px 18px", fontSize:16, color:"#F0EDE6", outline:"none", marginBottom:16, transition:"border-color 0.2s" }} />
          <button onClick={next} disabled={!name.trim()}
            style={{ width:"100%", maxWidth:360, padding:"15px", background:name.trim()?"linear-gradient(135deg,#00C853,#F5C518)":"#1A1A2E", border:"none", borderRadius:14, color:name.trim()?"#000":"#4A4A5A", fontSize:15, fontWeight:800, cursor:name.trim()?"pointer":"not-allowed", transition:"all 0.2s" }}>
            Continuer →
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100dvh" }}>
          <div style={{ padding:"20px 20px 12px", background:"#05050A", position:"sticky", top:0, zIndex:10, borderBottom:"1px solid #1A1A2E" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:28, marginBottom:6 }}>🌍</div>
              <div style={{ fontSize:20, fontWeight:900, color:"#F0EDE6" }}>Ton équipe favorite ?</div>
              <div style={{ fontSize:11, color:"#6A6A80", marginTop:4, letterSpacing:1 }}>48 ÉQUIPES · CDM 2026 · DÉFILE ET CHOISIS</div>
            </div>
            {team && (
              <div style={{ marginTop:10, padding:"8px 14px", background:"#00C85318", border:"1px solid #00C85344", borderRadius:10, textAlign:"center", animation:"fadeIn 0.2s ease" }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#00C853" }}>✓ Sélectionné : {team}</span>
              </div>
            )}
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:"12px 16px 100px" }}>
            {CONFEDS.map((conf, ci) => (
              <div key={ci} style={{ marginBottom:24 }}>
                <div style={{ fontSize:10, fontWeight:900, letterSpacing:2, color:conf.color, marginBottom:10, paddingLeft:2 }}>
                  {conf.name}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {conf.teams.map((t, ti) => {
                    const sel = team === `${t.flag} ${t.name}`;
                    return (
                      <button key={ti} onClick={() => setTeam(`${t.flag} ${t.name}`)}
                        style={{
                          padding:"12px 6px", borderRadius:12, cursor:"pointer",
                          background: sel ? conf.color+"22" : "#0C0C14",
                          border: `2px solid ${sel ? conf.color : t.hot ? "#F5C51844" : "#1A1A2E"}`,
                          color: sel ? conf.color : t.hot ? "#F5C518" : "#A0A0B8",
                          fontSize:11, fontWeight:700, textAlign:"center",
                          transition:"all 0.2s",
                          boxShadow: sel ? `0 0 14px ${conf.color}33` : "none",
                          position:"relative",
                        }}>
                        {t.hot && !sel && <div style={{ position:"absolute", top:4, right:4, width:6, height:6, borderRadius:"50%", background:"#F5C518" }} />}
                        <div style={{ fontSize:20, marginBottom:3 }}>{t.flag}</div>
                        <div style={{ fontSize:10, lineHeight:1.2 }}>{t.name}</div>
                        {sel && <div style={{ fontSize:9, color:conf.color, marginTop:2 }}>✓</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {team && (
            <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:10, maxWidth:480, margin:"0 auto", animation:"slideUp 0.35s ease" }}>
              <div style={{ margin:"0 14px 8px", background:`linear-gradient(135deg,#0a0a0a,#111120)`, border:`2px solid ${getConfColor(team)}`, borderRadius:18, padding:"16px 18px", overflow:"hidden", position:"relative" }}>
                <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 30% 50%, ${getConfColor(team)}18, transparent 70%)`, pointerEvents:"none" }} />
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ fontSize:52, lineHeight:1, filter:"drop-shadow(0 0 20px rgba(255,255,255,0.3))" }}>
                    {team.split(" ")[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:"#6A6A80", fontWeight:700, letterSpacing:2, marginBottom:4 }}>TON ÉQUIPE</div>
                    <div style={{ fontSize:22, fontWeight:900, color:"#F0EDE6", letterSpacing:-0.5, lineHeight:1 }}>
                      {team.split(" ").slice(1).join(" ")}
                    </div>
                    <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:"#00C853" }} />
                      <span style={{ fontSize:11, color:"#00C853", fontWeight:700 }}>Qualifiée · CDM 2026</span>
                    </div>
                  </div>
                  <div style={{ fontSize:28 }}>✅</div>
                </div>
              </div>
              <div style={{ padding:"0 14px 28px", background:"linear-gradient(transparent,#05050A 20%)" }}>
                <button onClick={next}
                  style={{ width:"100%", padding:"16px", background:"linear-gradient(135deg,#00C853,#F5C518)", border:"none", borderRadius:14, color:"#000", fontSize:16, fontWeight:900, cursor:"pointer", boxShadow:"0 8px 30px #F5C51844", letterSpacing:0.3 }}>
                  🦁 Entrer dans Lions Arena
                </button>
              </div>
            </div>
          )}

          {!team && (
            <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"12px 20px 28px", background:"linear-gradient(transparent,#05050A 30%)", zIndex:10, maxWidth:480, margin:"0 auto" }}>
              <button disabled style={{ width:"100%", padding:"15px", background:"#1A1A2E", border:"1px solid #2A2A3E", borderRadius:14, color:"#4A4A5A", fontSize:14, fontWeight:800, cursor:"not-allowed" }}>
                ☝️ Choisis ton équipe d'abord
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══ COUNTDOWN ══ */
function Countdown({ T }) {
  const [t, setT] = useState({d:0,h:0,m:0,s:0});
  useEffect(() => {
    const target = new Date("2026-06-16T21:00:00+02:00");
    const tick = () => { const d=target-new Date(); if(d>0) setT({d:Math.floor(d/86400000),h:Math.floor((d%86400000)/3600000),m:Math.floor((d%3600000)/60000),s:Math.floor((d%60000)/1000)}); };
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id);
  },[]);
  return (
    <div style={{ background:`linear-gradient(135deg,${T.bg==="#05050A"?"#0c1800,#010e04,#08080f":T.card2+","+T.card})`, border:`1px solid ${A.gold}44`, borderRadius:18, padding:"18px 20px", marginBottom:20, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 50% 0%,${A.gold}10,transparent 70%)` }} />
      <div style={{ position:"absolute", top:0, left:"10%", right:"10%", height:1.5, background:`linear-gradient(90deg,transparent,${A.gold}88,transparent)` }} />
      <div style={{ textAlign:"center", marginBottom:12, fontSize:10, fontWeight:900, letterSpacing:3, color:A.gold }}>🦁 SÉNÉGAL × FRANCE · 16 JUIN 2026</div>
      <div style={{ display:"flex", justifyContent:"center", gap:8 }}>
        {[["JOURS",t.d],["H",t.h],["MIN",t.m],["SEC",t.s]].map(([l,v]) => (
          <div key={l} style={{ textAlign:"center", flex:1 }}>
            <div style={{ fontSize:30, fontWeight:900, fontFamily:"monospace", color:A.gold, textShadow:`0 0 30px ${A.gold}55`, lineHeight:1 }}>{String(v).padStart(2,"0")}</div>
            <div style={{ fontSize:11, color:T.muted, letterSpacing:1.5, marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign:"center", marginTop:8, fontSize:11, color:T.muted }}>MetLife Stadium · East Rutherford, NJ · USA</div>
    </div>
  );
}

/* ══ FULL SCHEDULE DATA ══ */
const GROUPS_SCHEDULE = [
  { group:"A", color:"#06b6d4", teams:["🇺🇸 États-Unis","🇧🇴 Bolivie","🇵🇦 Panama","🇯🇲 Jamaïque"],
    matches:[
      { d:"12 Juin", t:"19h00", t1:"🇺🇸 États-Unis",  t2:"🇧🇴 Bolivie",      venue:"SoFi Stadium",        city:"Los Angeles",    country:"🇺🇸" },
      { d:"12 Juin", t:"22h00", t1:"🇵🇦 Panama",       t2:"🇯🇲 Jamaïque",     venue:"AT&T Stadium",        city:"Dallas",         country:"🇺🇸" },
      { d:"16 Juin", t:"16h00", t1:"🇧🇴 Bolivie",      t2:"🇵🇦 Panama",       venue:"Rose Bowl",            city:"Los Angeles",    country:"🇺🇸" },
      { d:"16 Juin", t:"22h00", t1:"🇺🇸 États-Unis",  t2:"🇯🇲 Jamaïque",     venue:"Arrowhead Stadium",   city:"Kansas City",    country:"🇺🇸" },
      { d:"21 Juin", t:"20h00", t1:"🇧🇴 Bolivie",      t2:"🇯🇲 Jamaïque",     venue:"Levi's Stadium",      city:"San Francisco",  country:"🇺🇸" },
      { d:"21 Juin", t:"20h00", t1:"🇵🇦 Panama",       t2:"🇺🇸 États-Unis",  venue:"MetLife Stadium",     city:"New York",       country:"🇺🇸" },
    ]},
  { group:"B", color:"#f97316", teams:["🇦🇷 Argentine","🇪🇨 Équateur","🇨🇱 Chili","🇵🇪 Pérou"],
    matches:[
      { d:"13 Juin", t:"16h00", t1:"🇦🇷 Argentine",   t2:"🇵🇪 Pérou",        venue:"Estadio Azteca",      city:"Mexico City",    country:"🇲🇽" },
      { d:"13 Juin", t:"19h00", t1:"🇪🇨 Équateur",    t2:"🇨🇱 Chili",        venue:"Estadio BBVA",        city:"Monterrey",      country:"🇲🇽" },
      { d:"17 Juin", t:"16h00", t1:"🇨🇱 Chili",       t2:"🇦🇷 Argentine",   venue:"Estadio Akron",       city:"Guadalajara",    country:"🇲🇽" },
      { d:"17 Juin", t:"22h00", t1:"🇵🇪 Pérou",       t2:"🇪🇨 Équateur",    venue:"AT&T Stadium",        city:"Dallas",         country:"🇺🇸" },
      { d:"22 Juin", t:"20h00", t1:"🇵🇪 Pérou",       t2:"🇨🇱 Chili",       venue:"Estadio Azteca",      city:"Mexico City",    country:"🇲🇽" },
      { d:"22 Juin", t:"20h00", t1:"🇦🇷 Argentine",   t2:"🇪🇨 Équateur",    venue:"Mercedes-Benz Stadium",city:"Atlanta",       country:"🇺🇸" },
    ]},
  { group:"C", color:"#8b5cf6", teams:["🇩🇪 Allemagne","🇯🇵 Japon","🇲🇽 Mexique","🇿🇦 Afr. du Sud"],
    matches:[
      { d:"11 Juin", t:"16h00", t1:"🇩🇪 Allemagne",   t2:"🇿🇦 Afr. du Sud", venue:"Gillette Stadium",    city:"Boston",         country:"🇺🇸" },
      { d:"11 Juin", t:"22h00", t1:"🇲🇽 Mexique",     t2:"🇯🇵 Japon",       venue:"Estadio Azteca",      city:"Mexico City",    country:"🇲🇽" },
      { d:"15 Juin", t:"16h00", t1:"🇿🇦 Afr. du Sud", t2:"🇲🇽 Mexique",     venue:"Estadio BBVA",        city:"Monterrey",      country:"🇲🇽" },
      { d:"15 Juin", t:"22h00", t1:"🇩🇪 Allemagne",   t2:"🇯🇵 Japon",       venue:"SoFi Stadium",        city:"Los Angeles",    country:"🇺🇸" },
      { d:"20 Juin", t:"20h00", t1:"🇿🇦 Afr. du Sud", t2:"🇯🇵 Japon",       venue:"Lumen Field",         city:"Seattle",        country:"🇺🇸" },
      { d:"20 Juin", t:"20h00", t1:"🇲🇽 Mexique",     t2:"🇩🇪 Allemagne",   venue:"AT&T Stadium",        city:"Dallas",         country:"🇺🇸" },
    ]},
  { group:"D", color:"#00C853", teams:["🇸🇳 Sénégal","🇫🇷 France","🇳🇴 Norvège","🇮🇶 Irak"], senegal:true,
    matches:[
      { d:"16 Juin", t:"21h00", t1:"🇸🇳 Sénégal",    t2:"🇫🇷 France",      venue:"MetLife Stadium",     city:"New York",       country:"🇺🇸", hot:true },
      { d:"16 Juin", t:"18h00", t1:"🇳🇴 Norvège",    t2:"🇮🇶 Irak",        venue:"Levi's Stadium",      city:"San Francisco",  country:"🇺🇸" },
      { d:"20 Juin", t:"18h00", t1:"🇫🇷 France",     t2:"🇮🇶 Irak",        venue:"Rose Bowl",            city:"Los Angeles",    country:"🇺🇸" },
      { d:"20 Juin", t:"21h00", t1:"🇸🇳 Sénégal",    t2:"🇳🇴 Norvège",    venue:"MetLife Stadium",     city:"New York",       country:"🇺🇸", sn:true },
      { d:"25 Juin", t:"20h00", t1:"🇮🇶 Irak",       t2:"🇸🇳 Sénégal",    venue:"BMO Field",            city:"Toronto",        country:"🇨🇦", sn:true },
      { d:"25 Juin", t:"20h00", t1:"🇫🇷 France",     t2:"🇳🇴 Norvège",    venue:"Gillette Stadium",    city:"Boston",         country:"🇺🇸" },
    ]},
  { group:"E", color:"#FF1744", teams:["🇪🇸 Espagne","🇵🇹 Portugal","🇲🇦 Maroc","🇺🇾 Uruguay"],
    matches:[
      { d:"12 Juin", t:"16h00", t1:"🇪🇸 Espagne",    t2:"🇺🇾 Uruguay",     venue:"Mercedes-Benz Stadium",city:"Atlanta",       country:"🇺🇸" },
      { d:"12 Juin", t:"19h00", t1:"🇵🇹 Portugal",   t2:"🇲🇦 Maroc",       venue:"Lincoln Financial",   city:"Philadelphie",   country:"🇺🇸" },
      { d:"17 Juin", t:"19h00", t1:"🇲🇦 Maroc",      t2:"🇪🇸 Espagne",     venue:"Arrowhead Stadium",   city:"Kansas City",    country:"🇺🇸" },
      { d:"17 Juin", t:"22h00", t1:"🇺🇾 Uruguay",    t2:"🇵🇹 Portugal",    venue:"Lumen Field",         city:"Seattle",        country:"🇺🇸" },
      { d:"22 Juin", t:"20h00", t1:"🇺🇾 Uruguay",    t2:"🇲🇦 Maroc",       venue:"SoFi Stadium",        city:"Los Angeles",    country:"🇺🇸" },
      { d:"22 Juin", t:"20h00", t1:"🇵🇹 Portugal",   t2:"🇪🇸 Espagne",     venue:"MetLife Stadium",     city:"New York",       country:"🇺🇸" },
    ]},
  { group:"F", color:"#2979FF", teams:["🇧🇷 Brésil","🇨🇴 Colombie","🇭🇷 Croatie","🇨🇦 Canada"],
    matches:[
      { d:"13 Juin", t:"22h00", t1:"🇧🇷 Brésil",     t2:"🇨🇦 Canada",      venue:"AT&T Stadium",        city:"Dallas",         country:"🇺🇸" },
      { d:"14 Juin", t:"16h00", t1:"🇨🇴 Colombie",   t2:"🇭🇷 Croatie",     venue:"Levi's Stadium",      city:"San Francisco",  country:"🇺🇸" },
      { d:"18 Juin", t:"16h00", t1:"🇨🇦 Canada",     t2:"🇨🇴 Colombie",    venue:"BMO Field",            city:"Toronto",        country:"🇨🇦" },
      { d:"18 Juin", t:"22h00", t1:"🇧🇷 Brésil",     t2:"🇭🇷 Croatie",     venue:"Rose Bowl",            city:"Los Angeles",    country:"🇺🇸" },
      { d:"23 Juin", t:"20h00", t1:"🇨🇦 Canada",     t2:"🇭🇷 Croatie",     venue:"BMO Field",            city:"Toronto",        country:"🇨🇦" },
      { d:"23 Juin", t:"20h00", t1:"🇨🇴 Colombie",   t2:"🇧🇷 Brésil",      venue:"Mercedes-Benz Stadium",city:"Atlanta",       country:"🇺🇸" },
    ]},
  { group:"G", color:"#F5C518", teams:["🇩🇰 Danemark","🇧🇪 Belgique","🇦🇺 Australie","🇨🇷 Costa Rica"],
    matches:[
      { d:"14 Juin", t:"19h00", t1:"🇩🇰 Danemark",   t2:"🇨🇷 Costa Rica",  venue:"SoFi Stadium",        city:"Los Angeles",    country:"🇺🇸" },
      { d:"14 Juin", t:"22h00", t1:"🇧🇪 Belgique",   t2:"🇦🇺 Australie",   venue:"Arrowhead Stadium",   city:"Kansas City",    country:"🇺🇸" },
      { d:"18 Juin", t:"16h00", t1:"🇦🇺 Australie",  t2:"🇩🇰 Danemark",    venue:"Gillette Stadium",    city:"Boston",         country:"🇺🇸" },
      { d:"18 Juin", t:"19h00", t1:"🇨🇷 Costa Rica",  t2:"🇧🇪 Belgique",   venue:"Lincoln Financial",   city:"Philadelphie",   country:"🇺🇸" },
      { d:"23 Juin", t:"20h00", t1:"🇦🇺 Australie",  t2:"🇨🇷 Costa Rica",  venue:"AT&T Stadium",        city:"Dallas",         country:"🇺🇸" },
      { d:"23 Juin", t:"20h00", t1:"🇧🇪 Belgique",   t2:"🇩🇰 Danemark",    venue:"MetLife Stadium",     city:"New York",       country:"🇺🇸" },
    ]},
  { group:"H", color:"#D500F9", teams:["🇵🇱 Pologne","🇳🇱 Pays-Bas","🇸🇦 Arabie Saoudite","🇨🇮 Côte d'Ivoire"],
    matches:[
      { d:"14 Juin", t:"16h00", t1:"🇳🇱 Pays-Bas",   t2:"🇵🇱 Pologne",     venue:"Estadio Azteca",      city:"Mexico City",    country:"🇲🇽" },
      { d:"15 Juin", t:"16h00", t1:"🇸🇦 Arabie S.",   t2:"🇨🇮 Côte d'Ivoire",venue:"Estadio BBVA",       city:"Monterrey",      country:"🇲🇽" },
      { d:"19 Juin", t:"16h00", t1:"🇵🇱 Pologne",    t2:"🇸🇦 Arabie S.",    venue:"Rose Bowl",            city:"Los Angeles",    country:"🇺🇸" },
      { d:"19 Juin", t:"22h00", t1:"🇳🇱 Pays-Bas",   t2:"🇨🇮 Côte d'Ivoire",venue:"AT&T Stadium",        city:"Dallas",         country:"🇺🇸" },
      { d:"24 Juin", t:"20h00", t1:"🇵🇱 Pologne",    t2:"🇨🇮 Côte d'Ivoire",venue:"Arrowhead Stadium",   city:"Kansas City",    country:"🇺🇸" },
      { d:"24 Juin", t:"20h00", t1:"🇸🇦 Arabie S.",   t2:"🇳🇱 Pays-Bas",    venue:"Levi's Stadium",      city:"San Francisco",  country:"🇺🇸" },
    ]},
  { group:"I", color:"#00E5FF", teams:["🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre","🇮🇷 Iran","🇳🇬 Nigeria","🇰🇷 Corée du Sud"],
    matches:[
      { d:"15 Juin", t:"19h00", t1:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre", t2:"🇮🇷 Iran",       venue:"Mercedes-Benz Stadium",city:"Atlanta",       country:"🇺🇸" },
      { d:"15 Juin", t:"22h00", t1:"🇳🇬 Nigeria",    t2:"🇰🇷 Corée du Sud",venue:"SoFi Stadium",        city:"Los Angeles",    country:"🇺🇸" },
      { d:"19 Juin", t:"16h00", t1:"🇮🇷 Iran",       t2:"🇳🇬 Nigeria",      venue:"Gillette Stadium",    city:"Boston",         country:"🇺🇸" },
      { d:"19 Juin", t:"19h00", t1:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre", t2:"🇰🇷 Corée du Sud",venue:"MetLife Stadium",     city:"New York",       country:"🇺🇸" },
      { d:"24 Juin", t:"20h00", t1:"🇮🇷 Iran",       t2:"🇰🇷 Corée du Sud",venue:"Lumen Field",         city:"Seattle",        country:"🇺🇸" },
      { d:"24 Juin", t:"20h00", t1:"🇳🇬 Nigeria",    t2:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre", venue:"Lincoln Financial",   city:"Philadelphie",   country:"🇺🇸" },
    ]},
  { group:"J", color:"#FF6D00", teams:["🇮🇹 Italie","🇯🇵 Japon","🇪🇬 Égypte","🇺🇦 Ukraine"],
    matches:[
      { d:"13 Juin", t:"16h00", t1:"🇮🇹 Italie",     t2:"🇺🇦 Ukraine",     venue:"Lincoln Financial",   city:"Philadelphie",   country:"🇺🇸" },
      { d:"13 Juin", t:"19h00", t1:"🇯🇵 Japon",      t2:"🇪🇬 Égypte",      venue:"BMO Field",            city:"Toronto",        country:"🇨🇦" },
      { d:"17 Juin", t:"16h00", t1:"🇪🇬 Égypte",     t2:"🇮🇹 Italie",      venue:"Mercedes-Benz Stadium",city:"Atlanta",       country:"🇺🇸" },
      { d:"17 Juin", t:"19h00", t1:"🇺🇦 Ukraine",    t2:"🇯🇵 Japon",       venue:"Arrowhead Stadium",   city:"Kansas City",    country:"🇺🇸" },
      { d:"21 Juin", t:"20h00", t1:"🇪🇬 Égypte",     t2:"🇺🇦 Ukraine",     venue:"Estadio Akron",       city:"Guadalajara",    country:"🇲🇽" },
      { d:"21 Juin", t:"20h00", t1:"🇯🇵 Japon",      t2:"🇮🇹 Italie",      venue:"Rose Bowl",            city:"Los Angeles",    country:"🇺🇸" },
    ]},
  { group:"K", color:"#10b981", teams:["🇫🇷 France","🇵🇹 Portugal","🇩🇰 Danemark","🇨🇲 Cameroun"],
    matches:[
      { d:"14 Juin", t:"22h00", t1:"🇫🇷 France",     t2:"🇨🇲 Cameroun",    venue:"Lumen Field",         city:"Seattle",        country:"🇺🇸" },
      { d:"15 Juin", t:"22h00", t1:"🇵🇹 Portugal",   t2:"🇩🇰 Danemark",    venue:"AT&T Stadium",        city:"Dallas",         country:"🇺🇸" },
      { d:"19 Juin", t:"22h00", t1:"🇨🇲 Cameroun",   t2:"🇩🇰 Danemark",    venue:"Estadio BBVA",        city:"Monterrey",      country:"🇲🇽" },
      { d:"20 Juin", t:"16h00", t1:"🇫🇷 France",     t2:"🇵🇹 Portugal",    venue:"MetLife Stadium",     city:"New York",       country:"🇺🇸" },
      { d:"25 Juin", t:"20h00", t1:"🇩🇰 Danemark",   t2:"🇫🇷 France",      venue:"Gillette Stadium",    city:"Boston",         country:"🇺🇸" },
      { d:"25 Juin", t:"20h00", t1:"🇨🇲 Cameroun",   t2:"🇵🇹 Portugal",    venue:"Mercedes-Benz Stadium",city:"Atlanta",       country:"🇺🇸" },
    ]},
  { group:"L", color:"#dc2626", teams:["🇧🇪 Belgique","🇩🇪 Allemagne","🇹🇷 Turquie","🇲🇦 Maroc"],
    matches:[
      { d:"16 Juin", t:"16h00", t1:"🇧🇪 Belgique",   t2:"🇲🇦 Maroc",       venue:"Estadio Akron",       city:"Guadalajara",    country:"🇲🇽" },
      { d:"16 Juin", t:"19h00", t1:"🇩🇪 Allemagne",  t2:"🇹🇷 Turquie",     venue:"AT&T Stadium",        city:"Dallas",         country:"🇺🇸" },
      { d:"21 Juin", t:"16h00", t1:"🇹🇷 Turquie",    t2:"🇧🇪 Belgique",    venue:"Levi's Stadium",      city:"San Francisco",  country:"🇺🇸" },
      { d:"21 Juin", t:"19h00", t1:"🇲🇦 Maroc",      t2:"🇩🇪 Allemagne",   venue:"Arrowhead Stadium",   city:"Kansas City",    country:"🇺🇸" },
      { d:"25 Juin", t:"20h00", t1:"🇹🇷 Turquie",    t2:"🇲🇦 Maroc",       venue:"Lincoln Financial",   city:"Philadelphie",   country:"🇺🇸" },
      { d:"25 Juin", t:"20h00", t1:"🇧🇪 Belgique",   t2:"🇩🇪 Allemagne",   venue:"SoFi Stadium",        city:"Los Angeles",    country:"🇺🇸" },
    ]},
];

/* ══ GROUP STANDINGS ══ */
const GROUP_STANDINGS = {
  A: [
    { team:"🇺🇸 États-Unis",  j:2, v:1, n:1, d:0, bp:3, bc:1, pts:4, form:["V","N"] },
    { team:"🇵🇦 Panama",      j:2, v:1, n:0, d:1, bp:2, bc:2, pts:3, form:["D","V"] },
    { team:"🇯🇲 Jamaïque",    j:2, v:0, n:1, d:1, bp:1, bc:2, pts:1, form:["N","D"] },
    { team:"🇧🇴 Bolivie",     j:1, v:0, n:0, d:1, bp:0, bc:1, pts:0, form:["D"] },
  ],
  B: [
    { team:"🇦🇷 Argentine",   j:1, v:1, n:0, d:0, bp:2, bc:0, pts:3, form:["V"] },
    { team:"🇪🇨 Équateur",    j:1, v:0, n:1, d:0, bp:1, bc:1, pts:1, form:["N"] },
    { team:"🇨🇱 Chili",       j:1, v:0, n:1, d:0, bp:1, bc:1, pts:1, form:["N"] },
    { team:"🇵🇪 Pérou",       j:1, v:0, n:0, d:1, bp:0, bc:2, pts:0, form:["D"] },
  ],
  C: [
    { team:"🇲🇽 Mexique",     j:1, v:1, n:0, d:0, bp:1, bc:0, pts:3, form:["V"] },
    { team:"🇩🇪 Allemagne",   j:1, v:0, n:1, d:0, bp:0, bc:0, pts:1, form:["N"] },
    { team:"🇯🇵 Japon",       j:1, v:0, n:1, d:0, bp:0, bc:0, pts:1, form:["N"] },
    { team:"🇿🇦 Afr. du Sud", j:1, v:0, n:0, d:1, bp:0, bc:1, pts:0, form:["D"] },
  ],
  D: [
    { team:"🇸🇳 Sénégal",    j:0, v:0, n:0, d:0, bp:0, bc:0, pts:0, form:[], lions:true },
    { team:"🇫🇷 France",     j:0, v:0, n:0, d:0, bp:0, bc:0, pts:0, form:[] },
    { team:"🇳🇴 Norvège",    j:0, v:0, n:0, d:0, bp:0, bc:0, pts:0, form:[] },
    { team:"🇮🇶 Irak",       j:0, v:0, n:0, d:0, bp:0, bc:0, pts:0, form:[] },
  ],
  E: [
    { team:"🇵🇹 Portugal",   j:1, v:1, n:0, d:0, bp:2, bc:0, pts:3, form:["V"] },
    { team:"🇲🇦 Maroc",      j:1, v:0, n:1, d:0, bp:0, bc:0, pts:1, form:["N"] },
    { team:"🇺🇾 Uruguay",    j:1, v:0, n:1, d:0, bp:0, bc:0, pts:1, form:["N"] },
    { team:"🇪🇸 Espagne",    j:1, v:0, n:0, d:1, bp:0, bc:2, pts:0, form:["D"] },
  ],
  F: [
    { team:"🇧🇷 Brésil",     j:1, v:1, n:0, d:0, bp:3, bc:0, pts:3, form:["V"] },
    { team:"🇨🇴 Colombie",   j:1, v:0, n:1, d:0, bp:1, bc:1, pts:1, form:["N"] },
    { team:"🇭🇷 Croatie",    j:1, v:0, n:1, d:0, bp:1, bc:1, pts:1, form:["N"] },
    { team:"🇨🇦 Canada",     j:1, v:0, n:0, d:1, bp:0, bc:3, pts:0, form:["D"] },
  ],
};

const H2H_SN_FR = {
  total: { sn:3, draw:3, fr:8 },
  matches: [
    { date:"31 Mai 2002",    competition:"Coupe du Monde · Séoul",      score:"1–0", winner:"sn", scorers:"Papa Bouba Diop 30'", detail:"But légendaire. Célébration au drapeau. L'Afrique entière debout." },
    { date:"11 Oct 2012",    competition:"Qualif. CAN · Dakar",          score:"2–0", winner:"sn", scorers:"Moussa Sow 34', 78'", detail:"Victoire convaincante au Sénégal. Moussa Sow décisif." },
    { date:"15 Nov 2022",    competition:"Match amical · Toulouse",      score:"1–1", winner:"draw", scorers:"Koulibaly 57' / Mbappé 70'", detail:"Match équilibré. Koulibaly face à Mbappé. Ambiance électrique." },
  ],
  keyStat: "Le Sénégal n'a jamais perdu contre la France en phase finale de Coupe du Monde",
};

const PLAYERS_TO_WATCH = [
  { name:"Sadio Mané",      team:"🇸🇳 Sénégal",   pos:"Ailier",    club:"Al-Nassr",    age:34, stat:"2 buts CDM · Ballon d'Or africain 2×",  emoji:"⚡", hot:true },
  { name:"Kylian Mbappé",   team:"🇫🇷 France",    pos:"Attaquant", club:"Real Madrid", age:27, stat:"12 buts CDM · Champion 2018",            emoji:"💨", hot:true },
  { name:"Erling Haaland",  team:"🇳🇴 Norvège",   pos:"Attaquant", club:"Man City",    age:25, stat:"1er Mondial · 54 buts PL 2022/23",       emoji:"🔨" },
  { name:"Lionel Messi",    team:"🇦🇷 Argentine", pos:"Meneur",    club:"Inter Miami", age:38, stat:"13 buts CDM · Champion 2022",            emoji:"🐐" },
  { name:"Vinicius Jr",     team:"🇧🇷 Brésil",    pos:"Ailier",    club:"Real Madrid", age:24, stat:"Finaliste Ligue des Champions 2022-24",  emoji:"🕺" },
  { name:"Lamine Yamal",    team:"🇪🇸 Espagne",   pos:"Ailier",    club:"FC Barcelone",age:18, stat:"Champion Euro 2024 à 17 ans",            emoji:"🌟" },
  { name:"Jude Bellingham", team:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre",pos:"Milieu",   club:"Real Madrid", age:22, stat:"MVP Real Madrid 2023/24",              emoji:"👑" },
  { name:"Bukayo Saka",     team:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre",pos:"Ailier",    club:"Arsenal",     age:23, stat:"Meilleur passeur Premier League 2024", emoji:"🎯" },
];

const FAN_ZONES_SN = [
  { city:"Dakar",       venue:"Place de l'Obélisque",    capacity:"50 000+", note:"Le cœur de Dakar. Célébrations légendaires depuis 2002." },
  { city:"Dakar",       venue:"Stade Léopold Sédar Senghor", capacity:"60 000", note:"Stade national. Écran géant pour les matchs des Lions." },
  { city:"Thiès",       venue:"Place de France",         capacity:"20 000",  note:"Fan zone officielle de la ville." },
  { city:"Saint-Louis", venue:"Place Faidherbe",         capacity:"15 000",  note:"Ambiance unique au bord du fleuve." },
  { city:"Ziguinchor",  venue:"Stade Aline Sitoé Diatta",capacity:"10 000",  note:"Casamance vibre pour les Lions." },
  { city:"Touba",       venue:"Grand Place",             capacity:"30 000+", note:"La ville sainte se mobilise pour les Lions." },
];

const WOLOF_GLOSSARY = [
  { wolof:"Gaindé",    french:"Lion",           context:"Le symbole de l'équipe nationale" },
  { wolof:"Teranga",   french:"Hospitalité",    context:"L'âme du peuple sénégalais" },
  { wolof:"Xam-xam",  french:"Connaissance",   context:"Maîtrise du ballon" },
  { wolof:"Yëgël",    french:"Comprendre/Passer",context:"La passe décisive" },
  { wolof:"Dafa neex",french:"C'est beau",      context:"Le jogo bonito à la sénégalaise" },
  { wolof:"Dem rekk", french:"Aller de l'avant",context:"L'état d'esprit des Lions 2026" },
  { wolof:"Sama xol", french:"Mon cœur",        context:"Ce que représentent les Lions" },
  { wolof:"Bañ defar",french:"Impossible",      context:"Ce qu'on pensait de 2002" },
];

const CDM_FORMAT_2026 = {
  teams: 48,
  groups: 12,
  teamsPerGroup: 4,
  qualifyPerGroup: 3,
  totalGroupMatches: 72,
  knockout: ["8e de finale (32 équipes)","Quarts (8)","Demi-finales (4)","Finale + 3e place"],
  hosts: ["🇺🇸 États-Unis (11 stades)","🇨🇦 Canada (2 stades)","🇲🇽 Mexique (3 stades)"],
  dates: "11 Juin → 19 Juillet 2026",
  final: "MetLife Stadium · New York · 19 Juillet",
  novelty: "1er Mondial à 48 équipes · 3 pays organisateurs · 104 matchs au total",
};

/* ══ MATCHES TAB ══ */
function MatchesTab({ T, user }) {
  const [view, setView] = useState("groupes");

  // Trouver le groupe de l'équipe favorite automatiquement
  const defaultGroup = (() => {
    if (!user?.team) return "D";
    const found = ALL_GROUPS.find(g => g.teams.some(t => t.includes(user.team.split(" ").slice(1).join(" "))));
    return found?.group || "D";
  })();

  const [selGroup, setSelGroup] = useState(defaultGroup);
  const group = ALL_GROUPS.find(g => g.group === selGroup);

  return (
    <div style={{ animation:"fadeIn 0.3s ease" }}>
      {/* ONGLETS */}
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["groupes","⚽ Groupes"],["knockout","🏆 Tableau"],["reactions","🔥 Live"]].map(([v,l]) => (
          <button key={v} onClick={()=>setView(v)} style={{ flex:1, padding:"9px 4px", borderRadius:11, border:`1px solid ${view===v?A.gold:T.border}`, background:view===v?A.gold+"14":"transparent", color:view===v?A.gold:T.muted, fontSize:11, fontWeight:800, cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {/* ══ GROUPES ══ */}
      {view==="groupes" && (
        <div>
          {/* BANDEAU INFO */}
          <div style={{ background:`linear-gradient(135deg,${A.green}0A,${T.card})`, border:`1px solid ${A.green}33`, borderRadius:14, padding:"12px 16px", marginBottom:16, display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:22 }}>⏳</span>
            <div>
              <div style={{ fontSize:12, fontWeight:800, color:A.green }}>CDM 2026 · Pas encore commencé</div>
              <div style={{ fontSize:11, color:T.muted }}>Scores live actifs dès le 11 Juin 2026</div>
            </div>
          </div>

          {/* SÉLECTEUR A→L */}
          <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:8, marginBottom:16, WebkitOverflowScrolling:"touch" }}>
            {ALL_GROUPS.map(g => (
              <button key={g.group} onClick={()=>setSelGroup(g.group)} style={{
                flexShrink:0, width:38, height:38, borderRadius:10,
                border:`2px solid ${selGroup===g.group ? g.color : T.border}`,
                background: selGroup===g.group ? g.color+"22" : T.card,
                color: selGroup===g.group ? g.color : T.muted,
                fontWeight:900, fontSize:13, cursor:"pointer",
                boxShadow: selGroup===g.group ? `0 0 12px ${g.color}44` : "none",
                position:"relative",
              }}>
                {g.group}
                {g.senegal && <div style={{ position:"absolute", top:2, right:2, width:6, height:6, borderRadius:"50%", background:A.green }} />}
              </button>
            ))}
          </div>

          {group && (
            <div>
              {/* HEADER GROUPE */}
              <div style={{ background:`linear-gradient(135deg,${group.color}14,${T.card})`, border:`1px solid ${group.color}44`, borderRadius:16, padding:"14px 16px", marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:900, color:group.color, letterSpacing:2 }}>GROUPE {group.group}</div>
                    {group.senegal && <div style={{ fontSize:10, color:A.green, fontWeight:700, marginTop:2 }}>🦁 GROUPE DU SÉNÉGAL</div>}
                  </div>
                  <div style={{ fontSize:11, color:T.muted }}>{group.matches.length} matchs</div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {group.teams.map((tm,i) => (
                    <div key={i} style={{ padding:"4px 10px", borderRadius:20, background:T.card2, border:`1px solid ${T.border}`, fontSize:12, fontWeight:600, color:T.text }}>{tm}</div>
                  ))}
                </div>
              </div>

              {/* MATCHS */}
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {group.matches.map((m, i) => {
                  const isHot = m.hot, isSn = m.sn;
                  const ac = isHot ? A.gold : isSn ? A.green : T.border;
                  return (
                    <div key={i} style={{
                      background: isHot ? `linear-gradient(135deg,#160b00,${T.card},#001408)` : T.card,
                      border:`1px solid ${isHot?A.gold+"55":isSn?A.green+"44":T.border}`,
                      borderRadius:14, padding:"12px 14px", position:"relative", overflow:"hidden",
                    }}>
                      {(isHot||isSn) && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${ac},transparent)` }} />}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <span style={{ fontSize:10, color:T.muted, fontFamily:"monospace" }}>J{i+1}</span>
                          {isHot && <span style={{ fontSize:10, color:A.gold, fontWeight:900, background:A.gold+"14", padding:"2px 8px", borderRadius:20 }}>🔥 CHOC HISTORIQUE</span>}
                          {isSn && <span style={{ fontSize:10, color:A.green, fontWeight:900, background:A.green+"14", padding:"2px 8px", borderRadius:20 }}>🦁 LIONS</span>}
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:A.gold, fontFamily:"monospace" }}>{m.time}</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <span style={{ fontSize:15, fontWeight:800, flex:1, color:T.text }}>{m.t1}</span>
                        <div style={{ padding:"6px 14px", borderRadius:8, background:isHot?A.gold+"18":isSn?A.green+"18":T.card2, border:`1px solid ${ac}33`, fontFamily:"monospace", fontWeight:900, fontSize:15, color:isHot?A.gold:isSn?A.green:T.muted }}>
                          VS
                        </div>
                        <span style={{ fontSize:15, fontWeight:800, flex:1, textAlign:"right", color:T.text }}>{m.t2}</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:11, color:T.muted }}>📅 {m.date}</span>
                        <span style={{ fontSize:11, color:T.muted }}>🏟️ {m.venue} · {m.city}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TABLEAU ÉLIMINATOIRE FIFA ══ */}
      {view==="knockout" && (
        <div>
          <div style={{ background:`linear-gradient(135deg,${A.gold}0A,${T.card})`, border:`1px solid ${A.gold}33`, borderRadius:14, padding:"12px 16px", marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:800, color:A.gold }}>🏆 TABLEAU ÉLIMINATOIRE OFFICIEL FIFA</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>48 équipes · 16 huitièmes · Dispatching FIFA officiel</div>
          </div>

          {KNOCKOUT_BRACKET.map((round, ri) => (
            <div key={ri} style={{ marginBottom:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <div style={{ height:1, flex:1, background:T.border }} />
                <div style={{ fontSize:11, fontWeight:900, color:A.gold, letterSpacing:1.5, padding:"4px 14px", borderRadius:20, border:`1px solid ${A.gold}33`, background:A.gold+"0A", whiteSpace:"nowrap" }}>
                  {round.round} · {round.date}
                </div>
                <div style={{ height:1, flex:1, background:T.border }} />
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {round.matches.map((m, mi) => (
                  <div key={mi} style={{
                    background: m.id==="final" ? `linear-gradient(135deg,${A.gold}14,${T.card})` : T.card,
                    border: `1px solid ${m.id==="final" ? A.gold+"55" : T.border}`,
                    borderRadius:12, padding:"10px 14px", position:"relative", overflow:"hidden",
                  }}>
                    {m.id==="final" && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${A.gold},transparent)` }} />}
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontSize:10, color:m.id==="final"?A.gold:T.muted, fontWeight:800, fontFamily:"monospace" }}>
                        {m.id==="final" ? "🏆 FINALE" : `M${mi+1}`}
                      </span>
                      <span style={{ fontSize:10, color:A.gold, fontWeight:700 }}>{m.date} · {m.time}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <div style={{ flex:1, padding:"8px 10px", background:T.card2, borderRadius:8, marginRight:8 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.text, fontFamily:"monospace" }}>{m.slot1}</div>
                      </div>
                      <div style={{ padding:"6px 12px", borderRadius:8, background:m.id==="final"?A.gold+"18":T.bg, border:`1px solid ${m.id==="final"?A.gold+"44":T.border}`, fontFamily:"monospace", fontWeight:900, fontSize:13, color:m.id==="final"?A.gold:T.muted, flexShrink:0 }}>
                        VS
                      </div>
                      <div style={{ flex:1, padding:"8px 10px", background:T.card2, borderRadius:8, marginLeft:8, textAlign:"right" }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.text, fontFamily:"monospace" }}>{m.slot2}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:10, color:T.muted }}>🏟️ {m.venue}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ RÉACTIONS LIVE ══ */}
      {view==="reactions" && (
        <div>
          <LiveScoreWidget T={T} />
          <ReactionsWidget T={T} />
        </div>
      )}
    </div>
  );
}
/* ══ REACTIONS ══ */
function ReactionsWidget({ T }) {
  const [counts, setCounts] = useState({"🔥":8423,"⚽":5211,"🦁":12890,"😱":3402,"❤️":7654,"👑":2341,"🙏":4503,"💯":6781});
  const [burst, setBurst] = useState(null);
  const react = r => { setCounts(p=>({...p,[r]:p[r]+1})); setBurst(r); setTimeout(()=>setBurst(null),500); };
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:16, marginTop:12 }}>
      <div style={{ fontSize:10, color:A.red, fontWeight:800, letterSpacing:2, marginBottom:12, display:"flex", alignItems:"center", gap:6 }}><Dot/>RÉACTIONS LIVE</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
        {["🔥","⚽","🦁","😱","❤️","👑","🙏","💯"].map(r => (
          <button key={r} onClick={()=>react(r)} style={{ background:burst===r?T.card2:T.bg, border:`1px solid ${burst===r?A.gold+"55":T.border}`, borderRadius:12, padding:"10px 4px", cursor:"pointer", textAlign:"center", transform:burst===r?"scale(1.15)":"scale(1)", transition:"all 0.15s" }}>
            <div style={{ fontSize:20 }}>{r}</div>
            <div style={{ fontSize:10, fontWeight:700, color:A.gold, fontFamily:"monospace", marginTop:2 }}>{counts[r]>9999?(counts[r]/1000).toFixed(1)+"k":counts[r].toLocaleString()}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══ SWIPE BACK WRAPPER ══ */
function SwipeBackWrapper({ onBack, children }) {
  const [swipeDx, setSwipeDx] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(null);
  const THRESHOLD = 80;

  const onTouchStart = (e) => {
    startX.current = e.targetTouches[0].clientX;
    setSwiping(true);
    setSwipeDx(0);
  };
  const onTouchMove = (e) => {
    if (!startX.current) return;
    const dx = e.targetTouches[0].clientX - startX.current;
    if (dx > 0) setSwipeDx(Math.min(dx, 120));
  };
  const onTouchEnd = () => {
    if (swipeDx > THRESHOLD) {
      setSwipeDx(0);
      setSwiping(false);
      onBack();
    } else {
      setSwipeDx(0);
      setSwiping(false);
    }
    startX.current = null;
  };

  const progress = Math.min(swipeDx / THRESHOLD, 1);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform: `translateX(${swipeDx * 0.3}px)`,
        transition: swiping ? "none" : "transform 0.3s ease",
        position: "relative",
      }}
    >
      {swipeDx > 10 && (
        <div style={{
          position: "fixed", left: 0, top: "50%", transform: "translateY(-50%)",
          zIndex: 999, display: "flex", alignItems: "center", gap: 0,
          animation: "fadeIn 0.1s ease",
        }}>
          <div style={{
            width: Math.min(swipeDx * 0.5, 56),
            height: 56,
            borderRadius: "0 14px 14px 0",
            background: `linear-gradient(135deg, ${progress > 0.8 ? "#00C853" : "#F5C518"}, ${progress > 0.8 ? "#00C853aa" : "#F5C518aa"})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 20px ${progress > 0.8 ? "#00C85355" : "#F5C51855"}`,
            transition: "background 0.2s",
            overflow: "hidden",
          }}>
            <span style={{ fontSize: 20, opacity: progress > 0.3 ? 1 : 0, transition: "opacity 0.2s" }}>
              {progress > 0.8 ? "✓" : "←"}
            </span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/* ══ HISTORY TAB ══ */
function HistoryTab({ T }) {
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState(null);
  const [activeMatch, setActiveMatch] = useState(0);
  const list = filter==="senegal" ? WC_TIMELINE.filter(e=>e.senegal) : [...WC_TIMELINE].reverse();

  if(sel) return (
    <SwipeBackWrapper onBack={()=>{setSel(null);setActiveMatch(0);}}>
      <button onClick={()=>{setSel(null);setActiveMatch(0);}} style={{ display:"flex", alignItems:"center", gap:5, background:"transparent", border:"none", color:T.muted, cursor:"pointer", fontSize:13, fontWeight:600, marginBottom:16 }}>← Retour</button>
      <div style={{ background:`linear-gradient(160deg,${sel.color}12,${T.card})`, border:`1px solid ${sel.color}44`, borderRadius:20, padding:22, marginBottom:14, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${sel.color},transparent)` }} />
        <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:48 }}>{sel.flag}</div>
          <div>
            <div style={{ fontSize:30, fontWeight:900, fontFamily:"monospace", color:sel.color, lineHeight:1 }}>{sel.year}</div>
            <div style={{ fontSize:12, color:T.muted }}>{sel.host}</div>
            <div style={{ fontSize:14, fontWeight:700, color:T.text, marginTop:3 }}>{sel.winner} 🏆</div>
            <div style={{ fontSize:11, color:T.muted, fontFamily:"monospace" }}>Finale : {sel.score}</div>
          </div>
        </div>
        <div style={{ fontSize:15, fontWeight:800, color:T.text, lineHeight:1.4, marginBottom:10 }}>{sel.headline}</div>
        <div style={{ fontSize:13, color:T.muted, lineHeight:1.75 }}>{sel.story}</div>
      </div>
      <div style={{ background:`${sel.color}0C`, border:`1px solid ${sel.color}2A`, borderRadius:14, padding:16, marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:800, letterSpacing:2, color:sel.color, marginBottom:8 }}>⚡ LE MOMENT LÉGENDAIRE</div>
        <div style={{ fontSize:13, color:T.text, lineHeight:1.7, fontStyle:"italic" }}>"{sel.moment}"</div>
      </div>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:18, marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:800, letterSpacing:2, color:A.gold, marginBottom:14 }}>📊 STATISTIQUES OFFICIELLES</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
          {[["🏳️",sel.stats.teams,"Équipes"],["⚽",sel.stats.goals,"Buts"],["📈",sel.stats.avg,"Buts/m"],["🏟️",sel.stats.att,"Att. max"]].map(([ico,v,l])=>(
            <div key={l} style={{ background:T.bg, borderRadius:10, padding:"10px 4px", textAlign:"center" }}>
              <div style={{ fontSize:12, marginBottom:2 }}>{ico}</div>
              <div style={{ fontSize:15, fontWeight:900, fontFamily:"monospace", color:A.gold }}>{v}</div>
              <div style={{ fontSize:9, color:T.muted, marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ background:A.blue+"0A", padding:"12px 14px", borderRadius:12, border:`1px solid ${A.blue}22` }}>
          <div style={{ fontSize:10, fontWeight:800, color:A.blue, marginBottom:4 }}>🥇 MEILLEUR BUTEUR</div>
          <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{sel.topScorer}</div>
        </div>
      </div>
      {sel.senegal && sel.lionsMoments && (
        <div style={{ background:T.bg==="#05050A"?"linear-gradient(135deg,#031203,#0c0c14)":T.card, border:`1px solid ${A.green}44`, borderRadius:18, padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:900, letterSpacing:2, color:A.green }}>🦁 LES LIONS AU {sel.year} — MATCH PAR MATCH</div>
            <span style={{ fontSize:20 }}>🇸🇳</span>
          </div>
          <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:4 }}>
            {sel.lionsMoments.map((m,i) => {
              const isW=m.result.startsWith("V"),isD=m.result.startsWith("N");
              const bc=isW?A.green:isD?A.gold:A.red;
              return <button key={i} onClick={()=>setActiveMatch(i)} style={{ flexShrink:0, padding:"6px 12px", borderRadius:9, cursor:"pointer", fontSize:11, fontWeight:800, border:`1px solid ${activeMatch===i?bc:T.border}`, background:activeMatch===i?bc+"18":"transparent", color:activeMatch===i?bc:T.muted }}>{m.icon} {m.vs.split(" ")[0]}</button>;
            })}
          </div>
          {(()=>{
            const m=sel.lionsMoments[activeMatch];
            const isW=m.result.startsWith("V"),isD=m.result.startsWith("N");
            const bc=isW?A.green:isD?A.gold:A.red;
            return (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:T.text }}>🇸🇳 vs {m.vs}</div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:26, fontWeight:900, fontFamily:"monospace", color:bc }}>{m.result.split(" ")[1]}</div>
                    <div style={{ fontSize:9, fontWeight:800, color:bc, letterSpacing:1 }}>{isW?"VICTOIRE":isD?"NUL":"DÉFAITE"}</div>
                  </div>
                </div>
                {m.scorers!=="—"&&<div style={{ background:A.green+"10", border:`1px solid ${A.green}22`, borderRadius:10, padding:"10px 14px", marginBottom:12 }}><span style={{ fontSize:11, color:A.green, fontWeight:700 }}>⚽ </span><span style={{ fontSize:13, color:T.text, fontWeight:600 }}>{m.scorers}</span></div>}
                <div style={{ marginBottom:6 }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:11, color:T.muted }}>Tirs tentés</span><span style={{ fontSize:12, fontWeight:800, fontFamily:"monospace", color:A.gold }}>{m.shots}</span></div><Bar value={m.shots} max={16} color={A.gold} T={T} /></div>
                <div style={{ marginBottom:6 }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:11, color:T.muted }}>Possession</span><span style={{ fontSize:12, fontWeight:800, fontFamily:"monospace", color:A.green }}>{m.poss}%</span></div><Bar value={m.poss} max={65} color={A.green} T={T} /></div>
                <div style={{ marginBottom:10 }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:11, color:T.muted }}>Passes complétées</span><span style={{ fontSize:12, fontWeight:800, fontFamily:"monospace", color:A.blue }}>{m.passes}</span></div><Bar value={m.passes} max={600} color={A.blue} T={T} /></div>
                <div style={{ fontSize:12, color:T.muted, fontStyle:"italic", lineHeight:1.6 }}>{m.story}</div>
              </div>
            );
          })()}
        </div>
      )}
    </SwipeBackWrapper>
  );

  return (
    <div style={{ animation:"fadeIn 0.3s ease" }}>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["all","🌍 Tout"],["senegal","🦁 Lions"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{ flex:1, padding:"8px", borderRadius:10, border:`1px solid ${filter===v?A.gold:T.border}`, background:filter===v?A.gold+"14":"transparent", color:filter===v?A.gold:T.muted, fontSize:12, fontWeight:700, cursor:"pointer" }}>{l}</button>
        ))}
      </div>
      <div style={{ fontSize:10, color:T.muted, letterSpacing:1.5, marginBottom:16, fontWeight:700 }}>
        {filter==="senegal" ? "🦁 3 PARTICIPATIONS — TAPEZ POUR LES STATS COMPLÈTES" : "1930 → 2022 · TAPEZ UNE ÉDITION POUR VIVRE L'HISTOIRE"}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {list.map((ed,i)=>(
          <div key={ed.year} onClick={()=>setSel(ed)} style={{
            background: ed.senegal ? `linear-gradient(135deg,${A.green}0C,${T.card})` : T.card,
            border: `1px solid ${ed.senegal ? A.green+"55" : ed.color+"33"}`,
            borderRadius:16, padding:"16px 18px", cursor:"pointer",
            position:"relative", overflow:"hidden",
            transition:"transform 0.2s, box-shadow 0.2s",
          }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${ed.color},${ed.color}44,transparent)` }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:28 }}>{ed.flag}</span>
                <div>
                  <span style={{ fontSize:22, fontWeight:900, fontFamily:"monospace", color:ed.senegal?A.green:ed.color, lineHeight:1 }}>{ed.year}</span>
                  <span style={{ fontSize:12, color:T.muted, marginLeft:8 }}>📍 {ed.host}</span>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13, fontWeight:800, color:T.text }}>{ed.winner}</div>
                <div style={{ fontSize:11, fontFamily:"monospace", color:T.muted, marginTop:1 }}>{ed.score}</div>
              </div>
            </div>
            <div style={{ height:1, background:T.border, marginBottom:10 }} />
            <div style={{ fontSize:15, fontWeight:800, color:T.text, lineHeight:1.35, marginBottom:6 }}>{ed.headline}</div>
            <div style={{ fontSize:12, color:T.muted, lineHeight:1.6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", marginBottom:10 }}>
              {ed.story}
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
              <div style={{ padding:"4px 10px", borderRadius:20, background:ed.color+"14", border:`1px solid ${ed.color}33` }}>
                <span style={{ fontSize:11, color:ed.color, fontWeight:700 }}>⚽ {ed.topScorer}</span>
              </div>
              {ed.senegal && (
                <div style={{ padding:"4px 10px", borderRadius:20, background:A.green+"14", border:`1px solid ${A.green}44` }}>
                  <span style={{ fontSize:11, color:A.green, fontWeight:800 }}>🦁 LIONS ICI</span>
                </div>
              )}
              <div style={{ marginLeft:"auto", fontSize:11, color:T.muted, fontWeight:600 }}>
                Voir tout →
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══ CDM EDITION STATS ══ */
const CDM_STATS = [
  { year:1930, topScorer:"Stábile 🇦🇷", goals:8,  assist:"—",               bestPlayer:"José Nasazzi 🇺🇾",   bestGK:"Enrique Ballestrero 🇺🇾", bestYoung:"—",               goals_total:70,  teams:13, matches:18, avg:3.9, champion:"🇺🇾 Uruguay",   topTeamScored:"🇺🇸 USA (6/3m)",    topTeamConc:"🇺🇸 USA (13 enc.)" },
  { year:1934, topScorer:"Nejedlý 🇨🇿",  goals:5,  assist:"—",               bestPlayer:"Giuseppe Meazza 🇮🇹",bestGK:"Ricardo Zamora 🇪🇸",     bestYoung:"—",               goals_total:70,  teams:16, matches:17, avg:4.1, champion:"🇮🇹 Italie",    topTeamScored:"🇩🇪 Allemagne",     topTeamConc:"🇩🇪 Allemagne" },
  { year:1938, topScorer:"Léonidas 🇧🇷", goals:8,  assist:"—",               bestPlayer:"Leônidas 🇧🇷",      bestGK:"—",                      bestYoung:"—",               goals_total:84,  teams:15, matches:18, avg:4.7, champion:"🇮🇹 Italie",    topTeamScored:"🇧🇷 Brésil",        topTeamConc:"🇨🇺 Cuba (12 enc.)" },
  { year:1950, topScorer:"Ademir 🇧🇷",   goals:9,  assist:"—",               bestPlayer:"Zizinho 🇧🇷",       bestGK:"Roque Máspoli 🇺🇾",      bestYoung:"—",               goals_total:88,  teams:13, matches:22, avg:4.0, champion:"🇺🇾 Uruguay",   topTeamScored:"🇺🇾 Uruguay (15)", topTeamConc:"🇧🇴 Bolivie (8/3m)" },
  { year:1954, topScorer:"Kocsis 🇭🇺",   goals:11, assist:"—",               bestPlayer:"Ferenc Puskás 🇭🇺", bestGK:"Gyula Grosics 🇭🇺",      bestYoung:"—",               goals_total:140, teams:16, matches:26, avg:5.4, champion:"🇩🇪 Allemagne", topTeamScored:"🇩🇪 All. (25)",    topTeamConc:"🇰🇷 Corée (16 enc.)" },
  { year:1958, topScorer:"Fontaine 🇫🇷", goals:13, assist:"Pelé 🇧🇷",        bestPlayer:"Didi 🇧🇷",          bestGK:"Harry Gregg 🏴󠁧󠁢󠁮󠁩󠁲󠁿",       bestYoung:"Pelé 🇧🇷 (17 ans)", goals_total:126, teams:16, matches:35, avg:3.6, champion:"🇧🇷 Brésil",    topTeamScored:"🇫🇷 France (23)",  topTeamConc:"🇦🇹 Autriche (14 enc.)" },
  { year:1962, topScorer:"Garrincha+Vavá 🇧🇷", goals:4, assist:"Garrincha 🇧🇷", bestPlayer:"Garrincha 🇧🇷", bestGK:"Viliam Schrojf 🇨🇿",   bestYoung:"—",               goals_total:89,  teams:16, matches:32, avg:2.8, champion:"🇧🇷 Brésil",    topTeamScored:"🇧🇷 Brésil (14)", topTeamConc:"🇨🇴 Colombie (11 enc.)" },
  { year:1966, topScorer:"Eusébio 🇵🇹",  goals:9,  assist:"Eusébio 🇵🇹",     bestPlayer:"Bobby Charlton 🏴󠁧󠁢󠁥󠁮󠁧󠁿",bestGK:"Gordon Banks 🏴󠁧󠁢󠁥󠁮󠁧󠁿",   bestYoung:"—",               goals_total:89,  teams:16, matches:32, avg:2.8, champion:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre",topTeamScored:"🇵🇹 Portugal (17)",topTeamConc:"🇰🇵 Corée N (21 enc.)" },
  { year:1970, topScorer:"Müller 🇩🇪",   goals:10, assist:"Pelé 🇧🇷",        bestPlayer:"Pelé 🇧🇷",          bestGK:"Ladislao Mazurkiewicz 🇺🇾",bestYoung:"—",             goals_total:95,  teams:16, matches:32, avg:3.0, champion:"🇧🇷 Brésil",    topTeamScored:"🇧🇷 Brésil (19)", topTeamConc:"🇸🇻 Salvador (9/3m)" },
  { year:1974, topScorer:"Lato 🇵🇱",     goals:7,  assist:"Cruyff 🇳🇱",      bestPlayer:"Johan Cruyff 🇳🇱",  bestGK:"Jan Jongbloed 🇳🇱",      bestYoung:"—",               goals_total:97,  teams:16, matches:38, avg:2.6, champion:"🇩🇪 Allemagne", topTeamScored:"🇵🇱 Pologne (16)", topTeamConc:"🇭🇹 Haïti (14 enc.)" },
  { year:1978, topScorer:"Kempes 🇦🇷",   goals:6,  assist:"Kempes 🇦🇷",      bestPlayer:"Mario Kempes 🇦🇷",  bestGK:"Ubaldo Fillol 🇦🇷",      bestYoung:"—",               goals_total:102, teams:16, matches:38, avg:2.7, champion:"🇦🇷 Argentine", topTeamScored:"🇦🇷 Argentine (15)",topTeamConc:"🇲🇽 Mexique (12 enc.)" },
  { year:1982, topScorer:"Rossi 🇮🇹",    goals:6,  assist:"Platini 🇫🇷",     bestPlayer:"Paolo Rossi 🇮🇹",   bestGK:"Dino Zoff 🇮🇹",          bestYoung:"—",               goals_total:146, teams:24, matches:52, avg:2.8, champion:"🇮🇹 Italie",    topTeamScored:"🇫🇷 France (16)",  topTeamConc:"🇳🇿 Zélande (12 enc.)" },
  { year:1986, topScorer:"Lineker 🏴󠁧󠁢󠁥󠁮󠁧󠁿",goals:6, assist:"Maradona 🇦🇷",  bestPlayer:"Diego Maradona 🇦🇷",bestGK:"Harald Schumacher 🇩🇪",  bestYoung:"—",               goals_total:132, teams:24, matches:52, avg:2.5, champion:"🇦🇷 Argentine", topTeamScored:"🇩🇪 All. (15)",    topTeamConc:"🇧🇬 Bulgarie (10 enc.)" },
  { year:1990, topScorer:"Schillaci 🇮🇹",goals:6,  assist:"Baggio 🇮🇹",      bestPlayer:"Salvatore Schillaci 🇮🇹",bestGK:"Sergio Goycochea 🇦🇷",bestYoung:"—",             goals_total:115, teams:24, matches:52, avg:2.2, champion:"🇩🇪 Allemagne", topTeamScored:"🇩🇪 All. (15)",    topTeamConc:"🇦🇪 EAU (11 enc.)" },
  { year:1994, topScorer:"Salenko 🇷🇺",  goals:6,  assist:"Baggio 🇮🇹",      bestPlayer:"Romário 🇧🇷",        bestGK:"Michel Preud'homme 🇧🇪", bestYoung:"Marc Overmars 🇳🇱",goals_total:141, teams:24, matches:52, avg:2.7, champion:"🇧🇷 Brésil",    topTeamScored:"🇩🇪 All. (15)",    topTeamConc:"🇸🇦 Arabie S. (12 enc.)" },
  { year:1998, topScorer:"Šuker 🇭🇷",    goals:6,  assist:"Zidane 🇫🇷",      bestPlayer:"Ronaldo 🇧🇷",        bestGK:"Fabien Barthez 🇫🇷",     bestYoung:"Michael Owen 🏴󠁧󠁢󠁥󠁮󠁧󠁿", goals_total:171, teams:32, matches:64, avg:2.7, champion:"🇫🇷 France",    topTeamScored:"🇩🇪 All. (14)",    topTeamConc:"🇾🇺 Yougoslavie (10 enc.)" },
  { year:2002, topScorer:"Ronaldo 🇧🇷",  goals:8,  assist:"Rivaldo 🇧🇷",     bestPlayer:"Oliver Kahn 🇩🇪",   bestGK:"Oliver Kahn 🇩🇪",        bestYoung:"Landon Donovan 🇺🇸",goals_total:161, teams:32, matches:64, avg:2.5, champion:"🇧🇷 Brésil",    topTeamScored:"🇧🇷 Brésil (18)", topTeamConc:"🇸🇦 Arabie S. (12 enc.)", senegal:"⚡ Sénégal bat France 1-0 · 8e de finale" },
  { year:2006, topScorer:"Klose 🇩🇪",    goals:5,  assist:"Zidane 🇫🇷",      bestPlayer:"Zinédine Zidane 🇫🇷",bestGK:"Gianluigi Buffon 🇮🇹",   bestYoung:"Lukas Podolski 🇩🇪",goals_total:147, teams:32, matches:64, avg:2.3, champion:"🇮🇹 Italie",    topTeamScored:"🇩🇪 All. (14)",    topTeamConc:"🇸🇦 Arabie S. (8 enc.)" },
  { year:2010, topScorer:"T.Müller 🇩🇪", goals:5,  assist:"Iniesta 🇪🇸",     bestPlayer:"Diego Forlán 🇺🇾",  bestGK:"Iker Casillas 🇪🇸",      bestYoung:"Thomas Müller 🇩🇪",goals_total:145, teams:32, matches:64, avg:2.3, champion:"🇪🇸 Espagne",   topTeamScored:"🇩🇪 All. (16)",    topTeamConc:"🇰🇵 Corée N (12/3m)" },
  { year:2014, topScorer:"J.Rodríguez 🇨🇴",goals:6,assist:"T.Müller 🇩🇪",   bestPlayer:"Lionel Messi 🇦🇷",  bestGK:"Manuel Neuer 🇩🇪",       bestYoung:"Paul Pogba 🇫🇷",   goals_total:171, teams:32, matches:64, avg:2.7, champion:"🇩🇪 Allemagne", topTeamScored:"🇩🇪 All. (18)",    topTeamConc:"🇧🇷 Brésil (14 enc.)" },
  { year:2018, topScorer:"Kane 🏴󠁧󠁢󠁥󠁮󠁧󠁿",   goals:6,  assist:"De Bruyne 🇧🇪",  bestPlayer:"Luka Modrić 🇭🇷",   bestGK:"Thibaut Courtois 🇧🇪",   bestYoung:"Kylian Mbappé 🇫🇷",goals_total:169, teams:32, matches:64, avg:2.6, champion:"🇫🇷 France",    topTeamScored:"🇧🇪 Belgique (16)",topTeamConc:"🇵🇦 Panama (11 enc.)", senegal:"💔 Éliminé par fair-play · 1 carton jaune de trop" },
  { year:2022, topScorer:"Mbappé 🇫🇷",   goals:8,  assist:"Messi 🇦🇷",       bestPlayer:"Lionel Messi 🇦🇷",  bestGK:"Dominik Livaković 🇭🇷",  bestYoung:"Gavi 🇪🇸",          goals_total:172, teams:32, matches:64, avg:2.7, champion:"🇦🇷 Argentine", topTeamScored:"🇫🇷 France (16)",  topTeamConc:"🇨🇷 Costa Rica (11 enc.)", senegal:"🦁 8e de finale · Sans Mané · Tête haute" },
];

const ALL_TIME_SCORERS = [
  { rank:1, name:"Miroslav Klose",  country:"🇩🇪", goals:16, matches:24, ratio:"0.67", editions:"2002-2014", color:A.gold },
  { rank:2, name:"Ronaldo Nazário", country:"🇧🇷", goals:15, matches:19, ratio:"0.79", editions:"1994-2006", color:A.green },
  { rank:3, name:"Gerd Müller",     country:"🇩🇪", goals:14, matches:13, ratio:"1.08", editions:"1970-1974", color:A.orange },
  { rank:4, name:"Just Fontaine",   country:"🇫🇷", goals:13, matches:6,  ratio:"2.17", editions:"1958",       color:A.red },
  { rank:5, name:"Lionel Messi",    country:"🇦🇷", goals:13, matches:26, ratio:"0.50", editions:"2006-2022", color:A.purple },
  { rank:6, name:"Kylian Mbappé",   country:"🇫🇷", goals:12, matches:14, ratio:"0.86", editions:"2018-2022", color:A.blue },
  { rank:7, name:"Pelé",            country:"🇧🇷", goals:12, matches:14, ratio:"0.86", editions:"1958-1970", color:A.gold },
  { rank:8, name:"Sándor Kocsis",   country:"🇭🇺", goals:11, matches:5,  ratio:"2.20", editions:"1954",       color:"#f97316" },
  { rank:9, name:"Jürgen Klinsmann",country:"🇩🇪", goals:11, matches:17, ratio:"0.65", editions:"1990-1998", color:A.gold },
  { rank:10,name:"Eusébio",         country:"🇵🇹", goals:9,  matches:6,  ratio:"1.50", editions:"1966",       color:"#dc2626" },
];

const ALL_TIME_ASSISTS = [
  { rank:1, name:"Lionel Messi",     country:"🇦🇷", assists:8,  editions:"2006-2022", color:A.purple, note:"+ 13 buts — double record" },
  { rank:2, name:"Diego Maradona",   country:"🇦🇷", assists:8,  editions:"1982-1994", color:A.blue,   note:"Meilleur passeur 1986" },
  { rank:3, name:"Pelé",             country:"🇧🇷", assists:8,  editions:"1958-1970", color:A.gold,   note:"Génie collectif" },
  { rank:4, name:"Johan Cruyff",     country:"🇳🇱", assists:6,  editions:"1974",       color:A.orange, note:"Football Total" },
  { rank:5, name:"Thomas Müller",    country:"🇩🇪", assists:6,  editions:"2010-2022", color:A.gold,   note:"Raum-deutung — maître de l'espace" },
  { rank:6, name:"Zinédine Zidane",  country:"🇫🇷", assists:5,  editions:"1998-2006", color:A.blue,   note:"Champion 1998 · Ballon d'Or 2006" },
  { rank:7, name:"Ronaldo Nazário",  country:"🇧🇷", assists:5,  editions:"1994-2006", color:A.green,  note:"15 buts + 5 passes — monstre" },
  { rank:8, name:"Luka Modrić",      country:"🇭🇷", assists:5,  editions:"2006-2022", color:"#06b6d4",note:"MVP 2018 · Finaliste 2018" },
];

const TOP_TEAMS_SCORED = [
  { rank:1, team:"🇩🇪 Allemagne",  goals:226, editions:20, avg:"11.3/éd", color:A.gold },
  { rank:2, team:"🇧🇷 Brésil",    goals:232, editions:22, avg:"10.5/éd", color:A.green },
  { rank:3, team:"🇦🇷 Argentine", goals:145, editions:18, avg:"8.1/éd",  color:A.blue },
  { rank:4, team:"🇫🇷 France",    goals:120, editions:16, avg:"7.5/éd",  color:"#2979FF" },
  { rank:5, team:"🇮🇹 Italie",    goals:128, editions:18, avg:"7.1/éd",  color:"#06b6d4" },
  { rank:6, team:"🇪🇸 Espagne",   goals:109, editions:16, avg:"6.8/éd",  color:A.red },
  { rank:7, team:"🇳🇱 Pays-Bas",  goals:87,  editions:11, avg:"7.9/éd",  color:A.orange },
  { rank:8, team:"🇸🇳 Sénégal",   goals:12,  editions:3,  avg:"4.0/éd",  color:A.green, note:"🦁 Lions" },
];

const TOP_TEAMS_CONCEDED = [
  { rank:1, team:"🇩🇪 Allemagne",  conc:125, editions:20, color:A.gold },
  { rank:2, team:"🇧🇷 Brésil",    conc:105, editions:22, color:A.green },
  { rank:3, team:"🇲🇽 Mexique",   conc:97,  editions:17, color:"#10b981" },
  { rank:4, team:"🇦🇷 Argentine", conc:88,  editions:18, color:A.blue },
  { rank:5, team:"🇮🇹 Italie",    conc:84,  editions:18, color:"#06b6d4" },
];

const RECORDS = [
  { ico:"🏆", title:"Plus grand score d'un match", value:"10–1 · Hongrie vs El Salvador", sub:"1982 · Le plus lourd de l'histoire", color:A.red },
  { ico:"⚽", title:"Plus de buts en une édition",  value:"171 buts", sub:"1998 et 2014 (ex aequo)", color:A.gold },
  { ico:"🏃", title:"Plus de matchs disputés",     value:"25 matchs · Lothar Matthäus 🇩🇪", sub:"4 Mondiaux · 1982-1998", color:A.blue },
  { ico:"🧤", title:"Meilleur gardien all-time",    value:"Gianluigi Buffon 🇮🇹", sub:"5 Mondiaux · 2002-2022 · 0.72 but encaissé/m", color:A.purple },
  { ico:"👶", title:"Plus jeune buteur",            value:"Pelé 🇧🇷 · 17 ans 239 jours", sub:"1958 · Suède vs Brésil · Finale", color:A.green },
  { ico:"👴", title:"Plus vieux buteur",            value:"Roger Milla 🇨🇲 · 42 ans 39 jours", sub:"1994 · Le roi camerounais", color:A.orange },
  { ico:"⚡", title:"But le plus rapide",           value:"10.8 sec · Hakan Şükür 🇹🇷", sub:"2002 · Turquie vs Corée du Sud", color:A.cyan },
  { ico:"🦁", title:"Record africain",              value:"Sénégal 🇸🇳 · 2002 · Quarts de finale", sub:"Meilleur résultat d'une équipe africaine débutante", color:A.green },
  { ico:"📏", title:"Plus grand nombre de matchs sans perdre", value:"Brésil 🇧🇷 · 13 matchs", sub:"1958-1966 · Série légendaire", color:"#10b981" },
  { ico:"🎯", title:"Plus de buts en 1 seul match", value:"Oleg Salenko 🇷🇺 · 5 buts", sub:"1994 · Russie 6-1 Cameroun", color:A.red },
];

/* ══ LEGENDS TAB ══ */
function LegendsTab({ T }) {
  const [view, setView] = useState("world");
  const [sel, setSel] = useState(null);
  const [compA, setCompA] = useState(0);
  const [compB, setCompB] = useState(1);
  const [subview, setSubview] = useState("list");
  const [statsView, setStatsView] = useState("editions");
  const [selEdition, setSelEdition] = useState(null);

  return (
    <div style={{ animation:"fadeIn 0.3s ease", width:"100%", overflowX:"hidden" }}>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["world","🌍 Hall of Fame"],["stats","📊 Stats CDM"],["lions","🦁 Lions"]].map(([v,l])=>(
          <button key={v} onClick={()=>{setView(v);setSel(null);setSelEdition(null);}} style={{ flex:1, padding:"8px 4px", borderRadius:10, border:`1px solid ${view===v?A.gold:T.border}`, background:view===v?A.gold+"14":"transparent", color:view===v?A.gold:T.muted, fontSize:11, fontWeight:700, cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {view==="stats" && (
        <div>
          <div style={{ display:"flex", gap:5, marginBottom:16, overflowX:"auto", paddingBottom:4 }}>
            {[["editions","📅 Par édition"],["scorers","⚽ Buteurs"],["assists","🎯 Passeurs"],["teams","🏳️ Équipes"],["records","⚡ Records"]].map(([v,l])=>(
              <button key={v} onClick={()=>setStatsView(v)} style={{ flexShrink:0, padding:"7px 12px", borderRadius:9, border:`1px solid ${statsView===v?A.gold:T.border}`, background:statsView===v?A.gold+"14":"transparent", color:statsView===v?A.gold:T.muted, fontSize:11, fontWeight:700, cursor:"pointer" }}>{l}</button>
            ))}
          </div>

          {statsView==="editions" && (
            <div>
              <div style={{ fontSize:11, color:T.muted, letterSpacing:1.5, fontWeight:700, marginBottom:12 }}>TAPEZ UNE ÉDITION POUR LES STATS COMPLÈTES</div>
              {[...CDM_STATS].reverse().map((ed,i)=>(
                <div key={i} onClick={()=>setSelEdition(selEdition?.year===ed.year?null:ed)}
                  style={{ background:ed.senegal?`linear-gradient(135deg,${A.green}0A,${T.card})`:T.card, border:`1px solid ${selEdition?.year===ed.year?A.gold+"88":ed.senegal?A.green+"44":T.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10, cursor:"pointer", transition:"all 0.2s" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <div style={{ fontSize:22, fontWeight:900, fontFamily:"monospace", color:ed.senegal?A.green:A.gold, lineHeight:1 }}>{ed.year}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{ed.champion}</div>
                        <div style={{ fontSize:11, color:T.muted }}>⚽ {ed.topScorer} · {ed.goals} buts</div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:13, fontWeight:800, fontFamily:"monospace", color:A.gold }}>{ed.goals_total}</div>
                      <div style={{ fontSize:9, color:T.muted }}>buts total</div>
                    </div>
                  </div>
                  {ed.senegal && <div style={{ marginTop:8, fontSize:11, color:A.green, fontWeight:700 }}>🦁 {ed.senegal}</div>}
                  {selEdition?.year===ed.year && (
                    <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${A.gold}22`, animation:"fadeIn 0.25s ease" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                        {[["🏆 Champion",ed.champion],["⚽ Top buteur",ed.topScorer+" ("+ed.goals+"buts)"],["🌟 Ballon d'Or",ed.bestPlayer],["🧤 Meill. gardien",ed.bestGK],["👶 Jeune talent",ed.bestYoung||"Non attribué"],["📊 Buts/match",ed.avg]].map(([k,v],j)=>(
                          <div key={j} style={{ background:T.bg, borderRadius:10, padding:"10px 10px" }}>
                            <div style={{ fontSize:9, color:T.muted, fontWeight:700, letterSpacing:1, marginBottom:4 }}>{k}</div>
                            <div style={{ fontSize:12, fontWeight:700, color:T.text, lineHeight:1.3 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                        {[["🏳️ Équipes",ed.teams],["⚽ Matchs",ed.matches],["📈 Moy.",ed.avg+"/m"]].map(([k,v],j)=>(
                          <div key={j} style={{ background:T.bg, borderRadius:10, padding:"8px 6px", textAlign:"center" }}>
                            <div style={{ fontSize:15, fontWeight:900, fontFamily:"monospace", color:A.gold }}>{v}</div>
                            <div style={{ fontSize:9, color:T.muted, marginTop:2 }}>{k}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:4 }}>
                        <div style={{ fontSize:11, color:A.green }}>🥅 + marqué : {ed.topTeamScored}</div>
                        <div style={{ fontSize:11, color:A.red }}>🔴 + encaissé : {ed.topTeamConc}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {statsView==="scorers" && (
            <div>
              <div style={{ background:`linear-gradient(135deg,${A.gold}0A,${T.card})`, border:`1px solid ${A.gold}33`, borderRadius:16, padding:18, marginBottom:14 }}>
                <div style={{ fontSize:11, color:A.gold, fontWeight:800, letterSpacing:2, marginBottom:16 }}>⚽ TOP BUTEURS ALL-TIME</div>
                {ALL_TIME_SCORERS.map((l,i)=>(
                  <div key={i} style={{ display:"flex", gap:12, alignItems:"center", padding:"10px 0", borderBottom:i<ALL_TIME_SCORERS.length-1?`1px solid ${T.border}`:"none" }}>
                    <div style={{ width:28, textAlign:"center" }}>
                      <span style={{ fontSize:14, fontWeight:900, fontFamily:"monospace", color:i<3?l.color:T.muted }}>#{l.rank}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:T.text }}>{l.name} {l.country}</div>
                      <div style={{ fontSize:11, color:T.muted }}>{l.editions}</div>
                      <div style={{ marginTop:6 }}><Bar value={l.goals} max={16} color={l.color} T={T} /></div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:22, fontWeight:900, fontFamily:"monospace", color:l.color }}>{l.goals}</div>
                      <div style={{ fontSize:9, color:T.muted }}>{l.ratio}/m · {l.matches}M</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background:T.card, border:`1px solid ${A.red}22`, borderRadius:14, padding:14 }}>
                <div style={{ fontSize:11, color:A.red, fontWeight:800, letterSpacing:2, marginBottom:8 }}>⚡ RECORDS EN 1 TOURNOI</div>
                {[{n:"Just Fontaine 🇫🇷",v:"13 buts",sub:"1958 · 6 matchs · INTOUCHABLE",c:A.red},{n:"Sándor Kocsis 🇭🇺",v:"11 buts",sub:"1954 · 5 matchs · Perfection",c:A.gold},{n:"Gerd Müller 🇩🇪",v:"10 buts",sub:"1970 · 6 matchs · Der Bomber",c:A.orange}].map((r,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<2?`1px solid ${T.border}`:"none" }}>
                    <div><div style={{ fontSize:13, fontWeight:700, color:T.text }}>{r.n}</div><div style={{ fontSize:11, color:T.muted }}>{r.sub}</div></div>
                    <div style={{ fontSize:18, fontWeight:900, fontFamily:"monospace", color:r.c }}>{r.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {statsView==="assists" && (
            <div>
              <div style={{ background:T.card, border:`1px solid ${A.blue}33`, borderRadius:16, padding:18 }}>
                <div style={{ fontSize:11, color:A.blue, fontWeight:800, letterSpacing:2, marginBottom:16 }}>🎯 TOP PASSEURS ALL-TIME</div>
                {ALL_TIME_ASSISTS.map((l,i)=>(
                  <div key={i} style={{ display:"flex", gap:12, alignItems:"center", padding:"10px 0", borderBottom:i<ALL_TIME_ASSISTS.length-1?`1px solid ${T.border}`:"none" }}>
                    <div style={{ width:28, textAlign:"center" }}>
                      <span style={{ fontSize:14, fontWeight:900, fontFamily:"monospace", color:i<3?l.color:T.muted }}>#{l.rank}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:T.text }}>{l.name} {l.country}</div>
                      <div style={{ fontSize:11, color:T.muted }}>{l.note}</div>
                      <div style={{ marginTop:6 }}><Bar value={l.assists} max={8} color={l.color} T={T} /></div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:22, fontWeight:900, fontFamily:"monospace", color:l.color }}>{l.assists}</div>
                      <div style={{ fontSize:9, color:T.muted }}>passes déc.</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {statsView==="teams" && (
            <div>
              <div style={{ background:T.card, border:`1px solid ${A.green}33`, borderRadius:16, padding:18, marginBottom:14 }}>
                <div style={{ fontSize:11, color:A.green, fontWeight:800, letterSpacing:2, marginBottom:16 }}>🥅 PLUS DE BUTS MARQUÉS (ALL-TIME)</div>
                {TOP_TEAMS_SCORED.map((t,i)=>(
                  <div key={i} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:13, fontWeight:900, fontFamily:"monospace", color:i<3?t.color:T.muted }}>#{t.rank}</span>
                        <span style={{ fontSize:14, fontWeight:700, color:t.note?A.green:T.text }}>{t.team}</span>
                        {t.note && <span style={{ fontSize:10, color:A.green }}>🦁</span>}
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <span style={{ fontSize:16, fontWeight:900, fontFamily:"monospace", color:t.color }}>{t.goals}</span>
                        <span style={{ fontSize:10, color:T.muted, marginLeft:4 }}>{t.avg}</span>
                      </div>
                    </div>
                    <Bar value={t.goals} max={232} color={t.color} T={T} />
                    <div style={{ fontSize:10, color:T.muted, marginTop:3 }}>{t.editions} éditions</div>
                  </div>
                ))}
              </div>
              <div style={{ background:T.card, border:`1px solid ${A.red}33`, borderRadius:16, padding:18 }}>
                <div style={{ fontSize:11, color:A.red, fontWeight:800, letterSpacing:2, marginBottom:16 }}>🔴 PLUS DE BUTS ENCAISSÉS (ALL-TIME)</div>
                {TOP_TEAMS_CONCEDED.map((t,i)=>(
                  <div key={i} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:13, fontWeight:900, fontFamily:"monospace", color:i<3?t.color:T.muted }}>#{t.rank}</span>
                        <span style={{ fontSize:14, fontWeight:700, color:T.text }}>{t.team}</span>
                      </div>
                      <span style={{ fontSize:16, fontWeight:900, fontFamily:"monospace", color:A.red }}>{t.conc}</span>
                    </div>
                    <Bar value={t.conc} max={125} color={A.red} T={T} />
                    <div style={{ fontSize:10, color:T.muted, marginTop:3 }}>{t.editions} éditions</div>
                  </div>
                ))}
              </div>
              <div style={{ background:T.card, border:`1px solid ${A.gold}33`, borderRadius:16, padding:18, marginTop:14 }}>
                <div style={{ fontSize:11, color:A.gold, fontWeight:800, letterSpacing:2, marginBottom:14 }}>🏆 PALMARÈS — CHAMPIONS DU MONDE</div>
                {[{t:"🇧🇷 Brésil",n:5,y:"1958,62,70,94,2002",c:A.green},{t:"🇩🇪 Allemagne",n:4,y:"1954,74,90,2014",c:A.gold},{t:"🇮🇹 Italie",n:4,y:"1934,38,82,2006",c:"#06b6d4"},{t:"🇦🇷 Argentine",n:3,y:"1978,86,2022",c:A.blue},{t:"🇫🇷 France",n:2,y:"1998,2018",c:"#2979FF"},{t:"🇺🇾 Uruguay",n:2,y:"1930,1950",c:A.cyan},{t:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre",n:1,y:"1966",c:A.red},{t:"🇪🇸 Espagne",n:1,y:"2010",c:A.orange}].map((ch,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<7?`1px solid ${T.border}`:"none" }}>
                    <div><div style={{ fontSize:14, fontWeight:700, color:T.text }}>{ch.t}</div><div style={{ fontSize:11, color:T.muted }}>{ch.y}</div></div>
                    <div style={{ display:"flex", gap:2 }}>{Array.from({length:ch.n},(_,k)=><span key={k} style={{ fontSize:16 }}>⭐</span>)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {statsView==="records" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ fontSize:11, color:T.muted, letterSpacing:2, fontWeight:700, marginBottom:4 }}>⚡ RECORDS HISTORIQUES ALL-TIME</div>
              {RECORDS.map((r,i)=>(
                <div key={i} style={{ background:T.card, border:`1px solid ${r.color}33`, borderRadius:14, padding:16, display:"flex", gap:14, alignItems:"flex-start" }}>
                  <div style={{ width:42, height:42, borderRadius:12, background:r.color+"14", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{r.ico}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:r.color, fontWeight:800, letterSpacing:1, marginBottom:4 }}>{r.title.toUpperCase()}</div>
                    <div style={{ fontSize:15, fontWeight:900, color:T.text, marginBottom:4 }}>{r.value}</div>
                    <div style={{ fontSize:12, color:T.muted, fontStyle:"italic" }}>{r.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view==="world" && (
        <>
          <div style={{ display:"flex", gap:6, marginBottom:14 }}>
            {[["list","🏅 Classement"],["compare","⚔️ Comparer"]].map(([v,l])=>(
              <button key={v} onClick={()=>setSubview(v)} style={{ flex:1, padding:"7px", borderRadius:9, border:`1px solid ${subview===v?A.blue:T.border}`, background:subview===v?A.blue+"14":"transparent", color:subview===v?A.blue:T.muted, fontSize:11, fontWeight:700, cursor:"pointer" }}>{l}</button>
            ))}
          </div>
          {subview==="list" && LEGENDS_DATA.map((l,i)=>(
            <div key={i} onClick={()=>setSel(sel?.rank===l.rank?null:l)} style={{ background:l.rank===1?`linear-gradient(135deg,${A.gold}0A,${T.card})`:T.card, border:`1px solid ${sel?.rank===l.rank?l.color+"88":l.rank<=3?l.color+"33":T.border}`, borderRadius:14, padding:15, marginBottom:10, cursor:"pointer", transition:"all 0.2s" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <span style={{ fontSize:15, fontWeight:900, fontFamily:"monospace", color:l.rank<=3?l.color:T.muted, width:28, textAlign:"center" }}>#{l.rank}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <div><div style={{ fontSize:14, fontWeight:800, color:T.text }}>{l.name} {l.country}</div><div style={{ fontSize:10, color:T.muted, marginTop:1 }}>{l.era} · {l.badge}</div></div>
                    <div style={{ textAlign:"right" }}><div style={{ fontSize:22, fontWeight:900, fontFamily:"monospace", color:l.color }}>{l.goals}</div><div style={{ fontSize:9, color:T.muted }}>buts</div></div>
                  </div>
                  <div style={{ marginTop:8 }}><Bar value={l.goals} max={16} color={l.color} T={T} /></div>
                </div>
              </div>
              {sel?.rank===l.rank&&<div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${l.color}22`, animation:"fadeIn 0.2s ease" }}>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  {[["Matchs",l.matches],["Ratio",l.ratio+"/m"]].map(([k,v])=><div key={k} style={{ flex:1, background:T.bg, borderRadius:8, padding:"8px 6px", textAlign:"center" }}><div style={{ fontSize:13, fontWeight:800, color:l.color }}>{v}</div><div style={{ fontSize:9, color:T.muted, marginTop:2 }}>{k}</div></div>)}
                </div>
                <div style={{ fontSize:12, color:T.muted, lineHeight:1.6, fontStyle:"italic" }}>{l.desc}</div>
              </div>}
            </div>
          ))}
          {subview==="compare" && (
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:18 }}>
              <div style={{ fontSize:10, color:A.blue, fontWeight:800, letterSpacing:2, marginBottom:14 }}>⚔️ COMPARE LES LÉGENDES</div>
              <div style={{ display:"flex", gap:8, marginBottom:18 }}>
                {[[compA,setCompA],[compB,setCompB]].map(([val,setter],idx)=>(
                  <select key={idx} value={val} onChange={e=>setter(Number(e.target.value))} style={{ flex:1, background:T.input, border:`1px solid ${T.inputBorder}`, color:T.text, borderRadius:10, padding:"9px 10px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    {LEGENDS_DATA.map((l,i)=><option key={i} value={i}>{l.name} {l.country}</option>)}
                  </select>
                ))}
              </div>
              {[["Buts totaux",LEGENDS_DATA[compA].goals,LEGENDS_DATA[compB].goals,16],["Matchs joués",LEGENDS_DATA[compA].matches,LEGENDS_DATA[compB].matches,26],["Ratio buts/m",LEGENDS_DATA[compA].ratio,LEGENDS_DATA[compB].ratio,2.2]].map(([cat,va,vb,mx],i)=>(
                <div key={i} style={{ marginBottom:16 }}>
                  <div style={{ textAlign:"center", fontSize:10, color:T.muted, letterSpacing:1, marginBottom:8 }}>{cat}</div>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <div style={{ flex:1, display:"flex", justifyContent:"flex-end" }}><div style={{ height:8, borderRadius:4, width:`${(va/mx)*100}%`, background:LEGENDS_DATA[compA].color, boxShadow:`0 0 8px ${LEGENDS_DATA[compA].color}55` }} /></div>
                    <div style={{ display:"flex", gap:6, minWidth:80, justifyContent:"center" }}>
                      <span style={{ fontSize:15, fontWeight:900, fontFamily:"monospace", color:LEGENDS_DATA[compA].color }}>{va}</span>
                      <span style={{ color:T.muted }}>·</span>
                      <span style={{ fontSize:15, fontWeight:900, fontFamily:"monospace", color:LEGENDS_DATA[compB].color }}>{vb}</span>
                    </div>
                    <div style={{ flex:1 }}><div style={{ height:8, borderRadius:4, width:`${(vb/mx)*100}%`, background:LEGENDS_DATA[compB].color, boxShadow:`0 0 8px ${LEGENDS_DATA[compB].color}55` }} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view==="lions" && SENEGAL_HEROES.map((p,i)=>(
        <div key={i} style={{ background:T.card, border:`1px solid ${A.green}33`, borderRadius:16, padding:18, marginBottom:12 }}>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ width:46, height:46, borderRadius:13, background:A.green+"14", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, border:`1px solid ${A.green}33`, flexShrink:0 }}>{p.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div style={{ fontSize:15, fontWeight:800, color:T.text }}>{p.name}</div>
                {p.goals>0&&<div style={{ textAlign:"right" }}><div style={{ fontSize:20, fontWeight:900, fontFamily:"monospace", color:A.gold }}>{p.goals}</div><div style={{ fontSize:9, color:T.muted }}>buts</div></div>}
              </div>
              <div style={{ fontSize:11, color:T.muted }}>{p.pos} · {p.club} · {p.years}</div>
              <div style={{ marginTop:8, fontSize:12, color:A.green, fontStyle:"italic", lineHeight:1.5 }}>"{p.quote}"</div>
              <div style={{ marginTop:8 }}>{p.stats.map((s,j)=><div key={j} style={{ fontSize:11, color:T.muted, marginBottom:2 }}>▸ {s}</div>)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══ PRONOSTICS TAB ══ */
function PronosticsTab({ T, user }) {
  const [picks, setPicks] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [view, setView] = useState("play");
  const [leaderboard, setLeaderboard] = useState([]);
  const [saving, setSaving] = useState({});
  const userId = getUserId();

  const loadPronostics = async () => {
    const data = await fbGet("pronostics");
    const myPicks = {};
    const scores = {};
    data.forEach(d => {
      if (d.userId === userId) myPicks[d.matchId] = d.pick;
      if (!scores[d.userId]) scores[d.userId] = { name: d.userName||"Lion", pts:0, flag:"🇸🇳", uid:d.userId };
      const m = PRONOSTICS_MATCHES.find(m => m.id === d.matchId);
      if (m?.locked && m.result === d.pick) scores[d.userId].pts += m.pts;
    });
    setSubmitted(myPicks);
    const board = Object.values(scores).sort((a,b)=>b.pts-a.pts).slice(0,10).map((p,i)=>({...p,rank:i+1,trend:i<3?"↑":"→"}));
    setLeaderboard(board);
  };

  useEffect(() => { loadPronostics(); }, []);

  const totalPts = Object.entries(submitted).reduce((acc,[id,pick]) => {
    const m = PRONOSTICS_MATCHES.find(m => m.id === id);
    if (!m || !m.locked || m.result !== pick) return acc;
    return acc + m.pts;
  }, 0);

  const submit = async (id) => {
    if (!picks[id]) return;
    setSaving(p=>({...p,[id]:true}));
    setSubmitted(p=>({...p,[id]:picks[id]}));
    await fbAdd("pronostics", { userId, userName: user?.name||"Lion Anonyme", matchId: id, pick: picks[id], pts: 0 });
    setSaving(p=>({...p,[id]:false}));
  };

  const myRank = leaderboard.findIndex(p=>p.uid===userId)+1;

  return (
    <div style={{ animation:"fadeIn 0.3s ease" }}>
      <div style={{ background:`linear-gradient(135deg,${A.gold}14,${T.card})`, border:`1px solid ${A.gold}44`, borderRadius:16, padding:18, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:12, color:A.gold, fontWeight:800, letterSpacing:1 }}>🎯 TON SCORE</div>
            <div style={{ fontSize:28, fontWeight:900, fontFamily:"monospace", color:A.gold, lineHeight:1.1 }}>{totalPts} pts</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>Bonjour {user?.name || "Lion"} 🦁</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:T.muted }}>Ton rang</div>
            <div style={{ fontSize:26, fontWeight:900, color:myRank>0?A.gold:T.text }}>#{myRank>0?myRank:"—"}</div>
            <div style={{ fontSize:10, color:A.green, fontWeight:700 }}>💾 Firebase</div>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["play","🎯 Jouer"],["board","🏆 Classement"]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={{ flex:1, padding:"8px", borderRadius:10, border:`1px solid ${view===v?A.gold:T.border}`, background:view===v?A.gold+"14":"transparent", color:view===v?A.gold:T.muted, fontSize:12, fontWeight:700, cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {view==="play" && (
        <div>
          <div style={{ fontSize:10, color:T.muted, letterSpacing:2, fontWeight:700, marginBottom:12 }}>PRONOSTIQUE ET GAGNE DES POINTS</div>
          {PRONOSTICS_MATCHES.map(m => {
            const isSubmitted = !!submitted[m.id];
            const isCorrect = m.locked && submitted[m.id]===m.result;
            const isSaving = saving[m.id];
            return (
              <div key={m.id} style={{ background:isCorrect?A.green+"0C":T.card, border:`1px solid ${isCorrect?A.green+"44":T.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <span style={{ fontSize:11, color:T.muted }}>{m.date}</span>
                  <span style={{ fontSize:11, fontWeight:800, color:A.gold }}>+{m.pts} pts</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:T.text }}>{m.t1}</span>
                  <span style={{ fontSize:12, color:T.muted, fontWeight:600 }}>VS</span>
                  <span style={{ fontSize:14, fontWeight:700, color:T.text }}>{m.t2}</span>
                </div>
                {m.locked ? (
                  <div style={{ textAlign:"center", padding:"8px", background:isCorrect?A.green+"18":T.card2, borderRadius:10, fontSize:12, fontWeight:700, color:isCorrect?A.green:T.muted }}>
                    {isCorrect?"✅ Bonne prédiction ! +"+m.pts+" pts":"Match terminé"}
                  </div>
                ) : isSubmitted ? (
                  <div style={{ textAlign:"center", padding:"8px", background:A.blue+"14", borderRadius:10, fontSize:12, fontWeight:700, color:A.blue }}>
                    ✓ {submitted[m.id]==="t1"?m.t1:submitted[m.id]==="draw"?"Match nul":m.t2} · 💾 Sauvegardé
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:6 }}>
                    {[["t1",m.t1.split(" ")[0]+" Victoire"],["draw","🤝 Nul"],["t2",m.t2.split(" ")[0]+" Victoire"]].map(([val,label])=>(
                      <button key={val} onClick={()=>setPicks(p=>({...p,[m.id]:val}))} style={{ flex:1, padding:"9px 4px", borderRadius:9, border:`2px solid ${picks[m.id]===val?A.gold:T.border}`, background:picks[m.id]===val?A.gold+"18":T.bg, color:picks[m.id]===val?A.gold:T.muted, fontSize:10, fontWeight:800, cursor:"pointer" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {!isSubmitted && !m.locked && picks[m.id] && (
                  <button onClick={()=>submit(m.id)} disabled={isSaving} style={{ width:"100%", marginTop:10, padding:"10px", background:isSaving?"#1A1A2E":`linear-gradient(135deg,${A.green},${A.gold})`, border:"none", borderRadius:10, color:isSaving?T.muted:"#000", fontWeight:800, fontSize:13, cursor:isSaving?"not-allowed":"pointer" }}>
                    {isSaving?"⏳ Sauvegarde...":"✓ Confirmer ma prédiction"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view==="board" && (
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:18 }}>
          <div style={{ fontSize:10, color:A.gold, fontWeight:800, letterSpacing:2, marginBottom:14 }}>🏆 CLASSEMENT RÉEL · FIREBASE</div>
          {leaderboard.length===0 && <div style={{ textAlign:"center", padding:"20px 0", color:T.muted, fontSize:13 }}>Sois le premier à pronostiquer ! 🦁</div>}
          {leaderboard.map((p,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:p.uid===userId?A.gold+"0C":i===0?A.gold+"0A":"transparent", borderRadius:10, border:`1px solid ${p.uid===userId?A.gold+"44":"transparent"}`, marginBottom:6 }}>
              <span style={{ fontSize:14, fontWeight:900, fontFamily:"monospace", color:i<3?A.gold:T.muted, width:24, textAlign:"center" }}>#{p.rank}</span>
              <span style={{ fontSize:16 }}>{p.flag}</span>
              <span style={{ flex:1, fontSize:14, fontWeight:600, color:p.uid===userId?A.gold:T.text }}>{p.name}{p.uid===userId?" (toi)":""}</span>
              <span style={{ fontSize:12, color:p.trend==="↑"?A.green:T.muted }}>{p.trend}</span>
              <span style={{ fontFamily:"monospace", fontWeight:900, color:A.gold, fontSize:14 }}>{p.pts}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function LiveScoreWidget({ T }) {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const refresh = async () => {
    setLoading(true);
    const [live, sched] = await Promise.all([fetchRealTimeMatches(), fetchUpcomingMatches()]);
    if (live) setLiveMatches(live);
    if (sched) setUpcoming(sched);
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, []);

  const hasKey = !!DATA_CONFIG.FOOTBALL_DATA_KEY;

  const formatScore = (m) => {
    const h = m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? "–";
    const a = m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? "–";
    return `${h} – ${a}`;
  };

  return (
    <div style={{ background:T.card, border:`1px solid ${hasKey?A.green+"44":T.border}`, borderRadius:16, padding:18, marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Dot color={hasKey?A.green:T.muted}/>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:1.5, color:hasKey?A.green:T.muted }}>
            {hasKey ? "DONNÉES LIVE · CDM 2026" : "MODE DÉMO"}
          </span>
        </div>
        <button onClick={refresh} disabled={loading} style={{ background:"transparent", border:`1px solid ${T.border}`, color:T.muted, borderRadius:8, padding:"4px 10px", fontSize:11, cursor:"pointer" }}>
          {loading ? "⏳" : "🔄"}
        </button>
      </div>

      {liveMatches.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:A.red, fontWeight:800, letterSpacing:2, marginBottom:8, display:"flex", gap:6, alignItems:"center" }}><Dot/> EN DIRECT</div>
          {liveMatches.map((m,i) => (
            <div key={i} style={{ background:T.bg, borderRadius:12, padding:"12px 14px", marginBottom:8, border:`1px solid ${A.red}33` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, fontWeight:700, color:T.text, flex:1 }}>{m.homeTeam?.shortName || m.homeTeam?.name}</span>
                <div style={{ textAlign:"center", padding:"0 10px" }}>
                  <div style={{ fontSize:20, fontWeight:900, fontFamily:"monospace", color:A.red }}>{formatScore(m)}</div>
                  <div style={{ fontSize:9, color:A.red, fontWeight:700 }}>LIVE</div>
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:T.text, flex:1, textAlign:"right" }}>{m.awayTeam?.shortName || m.awayTeam?.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {liveMatches.length === 0 && upcoming.length > 0 && (
        <div>
          <div style={{ fontSize:10, color:A.gold, fontWeight:800, letterSpacing:2, marginBottom:8 }}>📅 PROCHAINS MATCHS</div>
          {upcoming.slice(0,3).map((m,i) => {
            const d = new Date(m.utcDate);
            return (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<2?`1px solid ${T.border}`:"none" }}>
                <span style={{ fontSize:12, fontWeight:600, color:T.text, flex:1 }}>{m.homeTeam?.shortName || m.homeTeam?.name}</span>
                <div style={{ textAlign:"center", padding:"0 8px" }}>
                  <div style={{ fontSize:10, fontWeight:800, color:A.gold }}>VS</div>
                  <div style={{ fontSize:10, color:T.muted }}>{d.toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}</div>
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:T.text, flex:1, textAlign:"right" }}>{m.awayTeam?.shortName || m.awayTeam?.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {liveMatches.length === 0 && upcoming.length === 0 && (
        <div style={{ textAlign:"center", padding:"12px 0" }}>
          <div style={{ fontSize:24, marginBottom:6 }}>⏰</div>
          <div style={{ fontSize:13, color:T.muted }}>CDM 2026 · 11 Juin → 19 Juillet</div>
          <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>MetLife Stadium · New York · Finale 19 Juillet</div>
        </div>
      )}

      {lastUpdate && (
        <div style={{ fontSize:10, color:T.muted, marginTop:10, textAlign:"right" }}>
          Mis à jour : {lastUpdate.toLocaleTimeString("fr-FR", {hour:"2-digit",minute:"2-digit",second:"2-digit"})}
        </div>
      )}
    </div>
  );
}

/* ══ COMMUNITY COMMENTS ══ */
function CommunityTab({ T, user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [topic, setTopic] = useState("senegal");
  const [filter, setFilter] = useState("tous");
  const [liked, setLiked] = useState({});
  const [posting, setPosting] = useState(false);
  const userId = getUserId();

  const topics = [
    { id:"senegal", label:"🦁 Lions",    color:A.green },
    { id:"groupeD", label:"⚔️ Groupe D", color:A.gold },
    { id:"ia",      label:"🤖 IA",       color:A.blue },
    { id:"general", label:"🌍 Général",  color:"#8888AA" },
  ];

  const loadComments = async () => {
    const data = await fbGet("comments");
    data.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
    setComments(data);
    const myLikes = {};
    data.forEach(c => { if ((c.likedBy||[]).includes(userId)) myLikes[c.id] = true; });
    setLiked(myLikes);
  };

  useEffect(() => {
    loadComments();
    const interval = setInterval(loadComments, 10000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = (iso) => {
    if (!iso) return "À l'instant";
    const diff = Math.floor((new Date() - new Date(iso)) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff/60)}min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff/3600)}h`;
    return `Il y a ${Math.floor(diff/86400)}j`;
  };

  const handleLike = async (c) => {
    if (liked[c.id]) return;
    const newLikedBy = [...(c.likedBy||[]), userId];
    const newLikes = (parseInt(c.likes)||0) + 1;
    setLiked(p=>({...p,[c.id]:true}));
    setComments(prev=>prev.map(x=>x.id===c.id?{...x,likes:newLikes,likedBy:newLikedBy}:x));
    await fbUpdate("comments", c.id, { likes: newLikes, likedBy: newLikedBy });
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || posting) return;
    setPosting(true);
    const id = await fbAdd("comments", {
      name: user?.name || "Lion Anonyme",
      flag: "🇸🇳",
      text: newComment.trim(),
      topic,
      likes: 0,
      likedBy: [],
      userId,
    });
    setNewComment("");
    await loadComments();
    setPosting(false);
  };

  const filtered = filter==="tous" ? comments : comments.filter(c=>c.topic===filter);
  const topicColor = (t) => topics.find(x=>x.id===t)?.color || "#8888AA";
  const topicLabel = (t) => topics.find(x=>x.id===t)?.label || t;

  return (
    <div style={{ animation:"fadeIn 0.3s ease" }}>
      <div style={{ background:`linear-gradient(135deg,${A.green}0A,${T.card})`, border:`1px solid ${A.green}33`, borderRadius:16, padding:"14px 16px", marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:800, color:A.green, marginBottom:4 }}>💬 FORUM LIONS ARENA</div>
        <div style={{ fontSize:11, color:T.muted }}>Donne ton avis · Temps réel · Visible par tous 🔥</div>
        <div style={{ marginTop:10, display:"flex", gap:8 }}>
          <div style={{ textAlign:"center", flex:1, background:T.bg, borderRadius:10, padding:"8px" }}>
            <div style={{ fontSize:18, fontWeight:900, color:A.gold }}>{comments.length}</div>
            <div style={{ fontSize:10, color:T.muted }}>Avis</div>
          </div>
          <div style={{ textAlign:"center", flex:1, background:T.bg, borderRadius:10, padding:"8px" }}>
            <div style={{ fontSize:18, fontWeight:900, color:A.green }}>{comments.reduce((a,c)=>a+(parseInt(c.likes)||0),0)}</div>
            <div style={{ fontSize:10, color:T.muted }}>Likes</div>
          </div>
          <div style={{ textAlign:"center", flex:1, background:T.bg, borderRadius:10, padding:"8px" }}>
            <div style={{ fontSize:14, fontWeight:900, color:A.purple }}>🔄 Live</div>
            <div style={{ fontSize:10, color:T.muted }}>10s</div>
          </div>
        </div>
      </div>

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:800, color:T.text, marginBottom:10 }}>✍️ Ton avis, {user?.name || "Lion"} !</div>
        <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
          {topics.map(tp=>(
            <button key={tp.id} onClick={()=>setTopic(tp.id)} style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${topic===tp.id?tp.color:T.border}`, background:topic===tp.id?tp.color+"18":"transparent", color:topic===tp.id?tp.color:T.muted, fontSize:11, fontWeight:700, cursor:"pointer" }}>{tp.label}</button>
          ))}
        </div>
        <textarea value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Que penses-tu du match Sénégal vs France ?" rows={3}
          style={{ width:"100%", background:T.input, border:`1px solid ${newComment.trim()?A.green+"55":T.inputBorder}`, borderRadius:12, padding:"10px 14px", fontSize:13, color:T.text, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6 }} />
        <button onClick={handleSubmit} disabled={!newComment.trim()||posting}
          style={{ width:"100%", marginTop:10, padding:"11px", background:newComment.trim()&&!posting?`linear-gradient(135deg,${A.green},${A.gold})`:"#1A1A2E", border:"none", borderRadius:12, color:newComment.trim()&&!posting?"#000":T.muted, fontWeight:800, fontSize:13, cursor:newComment.trim()&&!posting?"pointer":"not-allowed" }}>
          {posting ? "⏳ Publication..." : "🦁 Publier mon avis"}
        </button>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:4 }}>
        {[["tous","🌍 Tous"],["senegal","🦁 Lions"],["groupeD","⚔️ Groupe D"],["ia","🤖 IA"],["general","🌍 Général"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{ flexShrink:0, padding:"6px 12px", borderRadius:20, border:`1px solid ${filter===v?A.gold:T.border}`, background:filter===v?A.gold+"14":"transparent", color:filter===v?A.gold:T.muted, fontSize:11, fontWeight:700, cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map((c,i)=>(
          <div key={c.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:A.green+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{c.flag||"🇸🇳"}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{c.name}</div>
                  <div style={{ fontSize:10, color:T.muted }}>{timeAgo(c.createdAt)}</div>
                </div>
              </div>
              <div style={{ padding:"3px 8px", borderRadius:20, background:topicColor(c.topic)+"18", border:`1px solid ${topicColor(c.topic)}33` }}>
                <span style={{ fontSize:10, fontWeight:700, color:topicColor(c.topic) }}>{topicLabel(c.topic)}</span>
              </div>
            </div>
            <div style={{ fontSize:13, color:T.text, lineHeight:1.65, marginBottom:10 }}>{c.text}</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <button onClick={()=>handleLike(c)} style={{ display:"flex", alignItems:"center", gap:6, background:liked[c.id]?A.gold+"14":"transparent", border:`1px solid ${liked[c.id]?A.gold+"44":T.border}`, borderRadius:20, padding:"5px 12px", cursor:liked[c.id]?"default":"pointer" }}>
                <span style={{ fontSize:14 }}>{liked[c.id]?"❤️":"🤍"}</span>
                <span style={{ fontSize:12, fontWeight:700, color:liked[c.id]?A.gold:T.muted }}>{parseInt(c.likes)||0}</span>
              </button>
              <span style={{ fontSize:10, color:T.muted }}>#{i+1}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:"30px 0", color:T.muted }}>
          <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
          <div style={{ fontSize:13 }}>Sois le premier à donner ton avis !</div>
        </div>
      )}
    </div>
  );
}
/* ══ AI TAB ══ */
function AITab({ T, user }) {
  const [mode, setMode] = useState("predict");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [chat, setChat] = useState([]);
  const [selMatchGroup, setSelMatchGroup] = useState("D");
  const [selMatch, setSelMatch] = useState(null);
  const [matchPrediction, setMatchPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);

  const AI_SYSTEM_CDM = `Tu es GPT-LIONS, l'IA experte en football de Lions Arena 2026. Tu analyses les matchs de la Coupe du Monde 2026 avec passion et précision. 
Réponds TOUJOURS en JSON strict avec ce format:
{
  "team1": "nom équipe 1",
  "team2": "nom équipe 2", 
  "score_predit": "X-X",
  "winner": "nom du vainqueur ou 'Nul'",
  "proba_team1": 45,
  "proba_nul": 25,
  "proba_team2": 30,
  "analyse": "2-3 phrases sur le match",
  "facteur_cle": "le facteur décisif",
  "joueur_a_surveiller": "nom du joueur"
}
Base-toi sur: forme récente, historique h2h, valeur des effectifs, style de jeu, groupe et enjeux.`;

  const predictMatch = async (t1, t2) => {
    setPredLoading(true);
    setMatchPrediction(null);
    const prompt = `Prédit le match ${t1} vs ${t2} de la Coupe du Monde 2026. Réponds uniquement en JSON.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:600, system:AI_SYSTEM_CDM, messages:[{role:"user",content:prompt}] })
      });
      const d = await res.json();
      const text = d.content?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g,"").trim();
      setMatchPrediction(JSON.parse(clean));
    } catch { setMatchPrediction(null); }
    setPredLoading(false);
  };

  const run = async (prompt) => {
    if(!prompt?.trim()) return;
    setLoading(true); setResult(null);
    const msgs = mode==="live" ? [...chat, {role:"user",content:prompt}] : [{role:"user",content:prompt}];
    const reply = await askClaude(msgs, AI_SYSTEM);
    if(mode==="live") setChat(prev=>[...prev,{role:"user",content:prompt},{role:"assistant",content:reply}]);
    setResult(reply);
    setLoading(false);
  };

  const modeConf = {
    matches:{ label:"⚽ Prédire matchs", color:A.green },
    predict:{ label:"🦁 Sénégal",       color:A.gold },
    live:   { label:"🎙️ Commentaire",   color:A.red },
  };

  const groupData = ALL_GROUPS.find(g=>g.group===selMatchGroup);

  return (
    <div style={{ animation:"fadeIn 0.3s ease", width:"100%", overflowX:"hidden" }}>

      {/* MODE TABS */}
      <div style={{ display:"flex", gap:5, marginBottom:16, overflowX:"auto", paddingBottom:4 }}>
        {Object.entries(modeConf).map(([k,v])=>(
          <button key={k} onClick={()=>{setMode(k);setResult(null);setInput("");setChat([]);setMatchPrediction(null);setSelMatch(null);}} style={{ flexShrink:0, padding:"8px 14px", borderRadius:10, border:`1px solid ${mode===k?v.color:T.border}`, background:mode===k?v.color+"18":"transparent", color:mode===k?v.color:T.muted, fontSize:11, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap" }}>{v.label}</button>
        ))}
      </div>

      {/* ══ MODE : PRÉDIRE TOUS LES MATCHS ══ */}
      {mode==="matches" && (
        <div>
          <div style={{ background:`linear-gradient(135deg,${A.green}0A,${T.card})`, border:`1px solid ${A.green}33`, borderRadius:14, padding:"12px 16px", marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:800, color:A.green }}>⚽ PRÉDICTIONS CDM 2026</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>Sélectionne un groupe puis un match — l'IA analyse tout 🤖</div>
          </div>

          {/* SÉLECTEUR GROUPE */}
          <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:8, marginBottom:14, WebkitOverflowScrolling:"touch" }}>
            {ALL_GROUPS.map(g=>(
              <button key={g.group} onClick={()=>{setSelMatchGroup(g.group);setSelMatch(null);setMatchPrediction(null);}} style={{
                flexShrink:0, width:36, height:36, borderRadius:9,
                border:`2px solid ${selMatchGroup===g.group?g.color:T.border}`,
                background:selMatchGroup===g.group?g.color+"22":T.card,
                color:selMatchGroup===g.group?g.color:T.muted,
                fontWeight:900, fontSize:12, cursor:"pointer",
                position:"relative",
              }}>
                {g.group}
                {g.senegal&&<div style={{ position:"absolute", top:1, right:1, width:5, height:5, borderRadius:"50%", background:A.green }} />}
              </button>
            ))}
          </div>

          {/* MATCHS DU GROUPE */}
          {groupData && (
            <div>
              <div style={{ fontSize:11, color:T.muted, letterSpacing:1.5, fontWeight:700, marginBottom:10 }}>GROUPE {selMatchGroup} · {groupData.matches.length} MATCHS · TAPE POUR PRÉDIRE</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
                {groupData.matches.map((m,i)=>{
                  const isSel = selMatch?.t1===m.t1&&selMatch?.t2===m.t2;
                  return (
                    <button key={i} onClick={()=>{setSelMatch(m);setMatchPrediction(null);}} style={{
                      background:isSel?`linear-gradient(135deg,${A.green}14,${T.card})`:T.card,
                      border:`1px solid ${isSel?A.green+"55":m.hot?A.gold+"44":T.border}`,
                      borderRadius:12, padding:"12px 14px", cursor:"pointer", textAlign:"left",
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:14, fontWeight:700, color:T.text }}>{m.t1}</span>
                        <div style={{ padding:"4px 10px", borderRadius:8, background:isSel?A.green+"18":T.card2, fontWeight:900, fontSize:12, color:isSel?A.green:T.muted, fontFamily:"monospace" }}>VS</div>
                        <span style={{ fontSize:14, fontWeight:700, color:T.text }}>{m.t2}</span>
                      </div>
                      <div style={{ fontSize:10, color:T.muted, marginTop:6 }}>📅 {m.date} · 🏟️ {m.venue}</div>
                      {m.hot&&<div style={{ fontSize:10, color:A.gold, fontWeight:800, marginTop:4 }}>🔥 CHOC HISTORIQUE</div>}
                    </button>
                  );
                })}
              </div>

              {/* BOUTON PRÉDIRE */}
              {selMatch && (
                <button onClick={()=>predictMatch(selMatch.t1, selMatch.t2)} disabled={predLoading} style={{
                  width:"100%", padding:"14px", marginBottom:16,
                  background:predLoading?"#1A1A2E":`linear-gradient(135deg,${A.green},${A.blue})`,
                  border:"none", borderRadius:14, color:predLoading?T.muted:"#fff",
                  fontWeight:900, fontSize:14, cursor:predLoading?"not-allowed":"pointer",
                }}>
                  {predLoading ? "🤖 GPT-LIONS analyse..." : `🔮 Prédire ${selMatch.t1.split(" ").slice(1).join(" ")} vs ${selMatch.t2.split(" ").slice(1).join(" ")}`}
                </button>
              )}

              {/* RÉSULTAT PRÉDICTION */}
              {predLoading && (
                <div style={{ textAlign:"center", padding:"24px 0" }}>
                  <div style={{ fontSize:32, animation:"ping 1s ease-in-out infinite", display:"inline-block" }}>⚽</div>
                  <div style={{ fontSize:12, color:T.muted, marginTop:10 }}>GPT-LIONS calcule les probabilités...</div>
                </div>
              )}

              {matchPrediction && !predLoading && (
                <div style={{ background:`linear-gradient(135deg,${A.green}0A,${T.card})`, border:`1px solid ${A.green}44`, borderRadius:18, padding:20, animation:"fadeIn 0.4s ease" }}>
                  <div style={{ fontSize:10, fontWeight:900, letterSpacing:2, color:A.green, marginBottom:16 }}>🤖 PRÉDICTION GPT-LIONS</div>

                  {/* SCORE PRÉDIT */}
                  <div style={{ textAlign:"center", marginBottom:20 }}>
                    <div style={{ display:"flex", justifyContent:"space-around", alignItems:"center", marginBottom:12 }}>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{matchPrediction.team1}</div>
                      </div>
                      <div style={{ padding:"10px 20px", borderRadius:14, background:A.gold+"18", border:`1px solid ${A.gold}44` }}>
                        <div style={{ fontSize:28, fontWeight:900, fontFamily:"monospace", color:A.gold }}>{matchPrediction.score_predit}</div>
                        <div style={{ fontSize:10, color:A.gold, fontWeight:700, textAlign:"center" }}>SCORE PRÉDIT</div>
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{matchPrediction.team2}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:14, fontWeight:800, color:A.green }}>
                      🏆 {matchPrediction.winner === "Nul" ? "Match Nul prédit" : `Victoire : ${matchPrediction.winner}`}
                    </div>
                  </div>

                  {/* PROBABILITÉS */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10, color:T.muted, fontWeight:700, letterSpacing:1.5, marginBottom:10 }}>PROBABILITÉS</div>
                    {[
                      { label:matchPrediction.team1, p:matchPrediction.proba_team1, c:A.green },
                      { label:"Nul",                 p:matchPrediction.proba_nul,   c:A.gold },
                      { label:matchPrediction.team2, p:matchPrediction.proba_team2, c:A.blue },
                    ].map((x,i)=>(
                      <div key={i} style={{ marginBottom:8 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:12, color:T.text }}>{x.label}</span>
                          <span style={{ fontSize:14, fontWeight:900, fontFamily:"monospace", color:x.c }}>{x.p}%</span>
                        </div>
                        <Bar value={x.p} max={100} color={x.c} T={T} h={6} />
                      </div>
                    ))}
                  </div>

                  {/* ANALYSE */}
                  <div style={{ background:T.card2, borderRadius:12, padding:14, marginBottom:12 }}>
                    <div style={{ fontSize:10, color:A.blue, fontWeight:800, letterSpacing:1, marginBottom:6 }}>📊 ANALYSE</div>
                    <div style={{ fontSize:13, color:T.text, lineHeight:1.7 }}>{matchPrediction.analyse}</div>
                  </div>

                  {/* FACTEUR CLÉ + JOUEUR */}
                  <div style={{ display:"flex", gap:8 }}>
                    <div style={{ flex:1, background:A.gold+"0A", border:`1px solid ${A.gold}22`, borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ fontSize:9, color:A.gold, fontWeight:800, marginBottom:4 }}>⚡ FACTEUR CLÉ</div>
                      <div style={{ fontSize:12, color:T.text }}>{matchPrediction.facteur_cle}</div>
                    </div>
                    <div style={{ flex:1, background:A.purple+"0A", border:`1px solid ${A.purple}22`, borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ fontSize:9, color:A.purple, fontWeight:800, marginBottom:4 }}>⭐ À SURVEILLER</div>
                      <div style={{ fontSize:12, color:T.text }}>{matchPrediction.joueur_a_surveiller}</div>
                    </div>
                  </div>

                  <button onClick={()=>predictMatch(selMatch.t1, selMatch.t2)} style={{ width:"100%", marginTop:12, background:"transparent", border:`1px solid ${T.border}`, color:T.muted, borderRadius:10, padding:"8px", fontSize:11, cursor:"pointer" }}>🔄 Nouvelle prédiction</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ MODE : SÉNÉGAL ══ */}
      {mode==="predict" && (
        <div>
          <LiveScoreWidget T={T} />
          <div style={{ background:T.bg==="#05050A"?"linear-gradient(135deg,#040c14,#090f1a)":T.card, border:`1px solid ${A.gold}33`, borderRadius:18, padding:20, marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:`linear-gradient(135deg,${A.blue},${A.purple})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🤖</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:800, color:T.text }}>GPT-LIONS · Powered by Claude</div>
                <div style={{ fontSize:10, color:T.muted }}>Analyses Sénégal CDM 2026</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}><Dot color={A.green} size={8}/><span style={{ fontSize:10, color:A.green, fontWeight:700 }}>EN LIGNE</span></div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { label:"🦁 Sénégal vs France · Prédiction complète", prompt:"Analyse en détail le match Sénégal vs France du 16 juin 2026. Probabilités, scénario, facteurs clés, joueurs décisifs." },
                { label:"📊 Parcours Sénégal · Groupe D complet", prompt:"Prédit le parcours complet du Sénégal dans le Groupe D : résultats vs France, Norvège, Irak. Qui se qualifie ?" },
                { label:"🏆 Jusqu'où ira le Sénégal ?", prompt:"Analyse les chances du Sénégal d'aller en finale de la CDM 2026. Quels adversaires possibles ? Peut-on gagner le titre ?" },
              ].map((btn,i)=>(
                <button key={i} onClick={()=>run(btn.prompt)} disabled={loading} style={{ padding:"12px 14px", background:T.card2, border:`1px solid ${T.border}`, borderRadius:12, color:T.text, fontSize:12, fontWeight:600, cursor:"pointer", textAlign:"left" }}>
                  {btn.label}
                </button>
              ))}
            </div>
            {loading && <div style={{ textAlign:"center", padding:"20px 0" }}><div style={{ fontSize:28, animation:"ping 1s ease-in-out infinite", display:"inline-block" }}>⚽</div><div style={{ fontSize:12, color:T.muted, marginTop:8 }}>GPT-LIONS analyse...</div></div>}
            {result && !loading && (
              <div style={{ background:T.card2, border:`1px solid ${A.gold}33`, borderRadius:12, padding:14, marginTop:14, animation:"fadeIn 0.4s ease" }}>
                <div style={{ fontSize:9, fontWeight:800, letterSpacing:2, color:A.gold, marginBottom:8 }}>🤖 ANALYSE GPT-LIONS</div>
                <div style={{ fontSize:13, color:T.text, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{result}</div>
                <button onClick={()=>setResult(null)} style={{ marginTop:10, background:"transparent", border:`1px solid ${T.border}`, color:T.muted, borderRadius:8, padding:"6px 12px", fontSize:11, cursor:"pointer" }}>✕ Fermer</button>
              </div>
            )}
          </div>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:18 }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:2, color:A.gold, marginBottom:14 }}>📊 MODÈLE IA · SÉNÉGAL VS FRANCE</div>
            {[{l:"🦁 Victoire Sénégal",p:63,c:A.green},{l:"🤝 Match nul",p:18,c:A.gold},{l:"🇫🇷 Victoire France",p:19,c:A.red}].map((x,i)=>(
              <div key={i} style={{ marginBottom:13 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}><span style={{ fontSize:13, color:T.text }}>{x.l}</span><span style={{ fontSize:18, fontWeight:900, fontFamily:"monospace", color:x.c }}>{x.p}%</span></div>
                <Bar value={x.p} max={100} color={x.c} T={T} h={7} />
              </div>
            ))}
            <div style={{ fontSize:11, color:T.muted, fontStyle:"italic", marginTop:4 }}>47 variables · xG · Forme · Météo NY · Historique</div>
          </div>
        </div>
      )}

      {/* ══ MODE : COMMENTAIRE LIVE ══ */}
      {mode==="live" && (
        <div>
          <div style={{ background:T.bg==="#05050A"?"linear-gradient(135deg,#1a0004,#090f1a)":T.card, border:`1px solid ${A.red}33`, borderRadius:18, padding:20, marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:`linear-gradient(135deg,${A.red},${A.orange})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🎙️</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:800, color:T.text }}>COMMENTAIRE RADIO LIVE</div>
                <div style={{ fontSize:10, color:T.muted }}>Décris la situation — GPT-LIONS commente !</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}><Dot color={A.red} size={8}/><span style={{ fontSize:10, color:A.red, fontWeight:700 }}>LIVE</span></div>
            </div>
            {chat.length>0 && (
              <div style={{ maxHeight:240, overflowY:"auto", marginBottom:12, display:"flex", flexDirection:"column", gap:8 }}>
                {chat.map((msg,i)=>(
                  <div key={i} style={{ padding:"10px 12px", borderRadius:12, background:msg.role==="user"?A.blue+"14":T.card2, fontSize:12, color:T.text, lineHeight:1.6 }}>
                    <span style={{ fontSize:9, fontWeight:800, color:msg.role==="user"?A.blue:A.gold, display:"block", marginBottom:3 }}>{msg.role==="user"?"🎙️ "+(user?.name||"Toi"):"🤖 GPT-LIONS"}</span>
                    {msg.content}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"flex", gap:8 }}>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&run(input)} placeholder="Ex: Mané dribble 2 défenseurs, 87e minute, 0-0..." style={{ flex:1, background:T.input, border:`1px solid ${T.inputBorder}`, color:T.text, borderRadius:10, padding:"10px 14px", fontSize:12, outline:"none" }} />
              <button onClick={()=>run(input)} disabled={loading||!input.trim()} style={{ background:`linear-gradient(135deg,${A.red},${A.orange})`, border:"none", color:"#fff", borderRadius:10, padding:"10px 14px", cursor:loading?"not-allowed":"pointer", fontWeight:800, fontSize:14, opacity:loading||!input.trim()?0.5:1 }}>🎙️</button>
            </div>
            {chat.length>0 && <button onClick={()=>setChat([])} style={{ width:"100%", marginTop:8, background:"transparent", border:`1px solid ${T.border}`, color:T.muted, borderRadius:8, padding:"6px", fontSize:11, cursor:"pointer" }}>🗑️ Effacer le fil</button>}
          </div>
        </div>
      )}

    </div>
  );
}

/* ══ MAIN APP ══ */
/* ══ SVG ICONS NAV ══ */
const NAV_ICONS = {
  matchs: (active, color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth={active?2.2:1.8}/>
      <path d="M12 2 C8 6 8 18 12 22" stroke={color} strokeWidth={active?2:1.6}/>
      <path d="M12 2 C16 6 16 18 12 22" stroke={color} strokeWidth={active?2:1.6}/>
      <path d="M2 12 L22 12" stroke={color} strokeWidth={active?2:1.6}/>
      <path d="M3.5 7 L20.5 7" stroke={color} strokeWidth={active?1.8:1.4}/>
      <path d="M3.5 17 L20.5 17" stroke={color} strokeWidth={active?1.8:1.4}/>
    </svg>
  ),
  histoire: (active, color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2 L15 9 L22 9 L16.5 14 L18.5 21 L12 17 L5.5 21 L7.5 14 L2 9 L9 9 Z" stroke={color} strokeWidth={active?2:1.7} strokeLinejoin="round" fill={active?color+"33":"none"}/>
    </svg>
  ),
  legendes: (active, color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 4 L6 14 C6 18 18 18 18 14 L18 4" stroke={color} strokeWidth={active?2.2:1.8} strokeLinecap="round"/>
      <path d="M4 4 L20 4" stroke={color} strokeWidth={active?2.2:1.8} strokeLinecap="round"/>
      <path d="M9 20 L15 20" stroke={color} strokeWidth={active?2.2:1.8} strokeLinecap="round"/>
      <path d="M12 18 L12 20" stroke={color} strokeWidth={active?2:1.8} strokeLinecap="round"/>
    </svg>
  ),
  pronos: (active, color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={active?2.2:1.8}/>
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth={active?2:1.6}/>
      <circle cx="12" cy="12" r="1.5" fill={color}/>
      <line x1="12" y1="3" x2="12" y2="6" stroke={color} strokeWidth={active?2:1.6} strokeLinecap="round"/>
      <line x1="12" y1="18" x2="12" y2="21" stroke={color} strokeWidth={active?2:1.6} strokeLinecap="round"/>
      <line x1="3" y1="12" x2="6" y2="12" stroke={color} strokeWidth={active?2:1.6} strokeLinecap="round"/>
      <line x1="18" y1="12" x2="21" y2="12" stroke={color} strokeWidth={active?2:1.6} strokeLinecap="round"/>
    </svg>
  ),
  ia: (active, color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="13" rx="3" stroke={color} strokeWidth={active?2.2:1.8}/>
      <circle cx="8" cy="12" r="2" stroke={color} strokeWidth={active?2:1.6}/>
      <circle cx="16" cy="12" r="2" stroke={color} strokeWidth={active?2:1.6}/>
      <path d="M10 12 L14 12" stroke={color} strokeWidth={active?2:1.6} strokeLinecap="round"/>
      <path d="M8 6 L8 4" stroke={color} strokeWidth={active?2:1.8} strokeLinecap="round"/>
      <path d="M16 6 L16 4" stroke={color} strokeWidth={active?2:1.8} strokeLinecap="round"/>
      <path d="M12 6 L12 4" stroke={color} strokeWidth={active?1.8:1.6} strokeLinecap="round"/>
    </svg>
  ),
  forum: (active, color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M21 15 C21 16.1 20.1 17 19 17 L7 17 L3 21 L3 5 C3 3.9 3.9 3 5 3 L19 3 C20.1 3 21 3.9 21 5 Z" stroke={color} strokeWidth={active?2.2:1.8} strokeLinejoin="round" fill={active?color+"18":"none"}/>
      <line x1="7" y1="8" x2="17" y2="8" stroke={color} strokeWidth={active?1.8:1.5} strokeLinecap="round"/>
      <line x1="7" y1="12" x2="14" y2="12" stroke={color} strokeWidth={active?1.8:1.5} strokeLinecap="round"/>
    </svg>
  ),
};

const TABS=[["matchs","Matchs"],["histoire","Histoire"],["legendes","Légendes"],["pronos","Pronos"],["ia","IA"],["forum","Forum"]];

export default function App() {
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem("lions_user"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [isDark, setIsDark] = useState(true);
  const [tab, setTab] = useState(0);
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [navShrunk, setNavShrunk] = useState(false);
  const lastScrollY = useRef(0);
  const bodyRef = useRef(null);

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent = [
      "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,700;9..40,900&display=swap');",
      "@keyframes ping { 75%, 100% { transform:scale(2.3); opacity:0; } }",
      "@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }",
      "@keyframes fadeOut { to { opacity:0; transform:scale(1.05); } }",
      "@keyframes slideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }",
      "@keyframes particleFloat { from { transform:translateY(0); opacity:0.15; } to { transform:translateY(-20px); opacity:0.35; } }",
      "* { box-sizing:border-box; margin:0; padding:0; }",
      "::-webkit-scrollbar { width:2px; } ::-webkit-scrollbar-thumb { background:#333344; border-radius:2px; }",
      "select option { background:#111120; }",
      "input::placeholder { color:#5a5a7a; }"
    ].join(" ");
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, []);

  useEffect(() => {
    const onInstallable = () => setInstallable(true);
    window.addEventListener('pwaInstallable', onInstallable);
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true);
    if ('Notification' in window) setNotifGranted(Notification.permission === 'granted');
    return () => window.removeEventListener('pwaInstallable', onInstallable);
  }, []);

  const handleInstall = async () => {
    if (window.__installPWA) {
      const ok = await window.__installPWA();
      if (ok) { setInstalled(true); setInstallable(false); }
    }
  };

  const handleNotif = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifGranted(perm === 'granted');
      if (perm === 'granted') {
        new Notification('Lions Arena - Activé !', {
          body: 'Tu recevras les alertes matchs en temps réel.',
          icon: '/icons/icon-192.png'
        });
      }
    }
  };

  const T = THEMES[isDark?"dark":"light"];
  const tabSwipe = useSwipe(
    () => { if (tab > 0) changeTab(tab - 1); },
    () => { if (tab < TABS.length - 1) changeTab(tab + 1); }
  );

  const handleDone = (u) => {
    setUser(u);
    localStorage.setItem("lions_user", JSON.stringify(u));
  };
  const changeTab = i => { setTab(i); if(bodyRef.current) bodyRef.current.scrollTop=0; setNavShrunk(false); };

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const handleScroll = () => {
      const curr = el.scrollTop;
      if (curr > lastScrollY.current + 8) setNavShrunk(true);
      else if (curr < lastScrollY.current - 8) setNavShrunk(false);
      lastScrollY.current = curr;
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  if(!user) return <Splash onDone={handleDone} />;

  return (
    <div style={{ background:T.bg, height:"100%", minHeight:"100dvh", color:T.text, fontFamily:"sans-serif", display:"flex", flexDirection:"column", overflow:"hidden", transition:"background 0.3s,color 0.3s", position:"fixed", top:0, left:0, right:0, bottom:0, paddingTop:"env(safe-area-inset-top)", paddingBottom:"env(safe-area-inset-bottom)" }}>
      {/* HEADER */}
      <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${T.border}`, background:T.header, backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:300, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${A.green},${A.gold})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, boxShadow:`0 0 18px ${A.gold}44` }}>🦁</div>
          <div>
            <div style={{ fontSize:17, fontWeight:900, letterSpacing:-0.5, lineHeight:1 }}>LIONS <span style={{ color:A.gold }}>ARENA</span></div>
            <div style={{ fontSize:10, color:T.muted, letterSpacing:2 }}>THE LIVING HISTORY · 2026</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:7, alignItems:"center" }}>
          <div style={{ background:A.red+"18", border:`1px solid ${A.red}44`, borderRadius:7, padding:"4px 8px", display:"flex", alignItems:"center", gap:5 }}>
            <Dot/><span style={{ fontSize:11, color:A.red, fontWeight:700 }}>LIVE</span>
          </div>
          <button onClick={()=>setIsDark(!isDark)} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:"5px 10px", cursor:"pointer", fontSize:15, transition:"all 0.2s" }}>
            {isDark?"☀️":"🌙"}
          </button>
        </div>
      </div>

      {/* PWA INSTALL BANNER */}
      {(installable || !notifGranted) && !installed && (
        <div style={{ background:`linear-gradient(135deg,${A.green}18,${A.gold}0A)`, borderBottom:`1px solid ${A.gold}33`, padding:"10px 18px", display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>📲</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:800, color:A.gold }}>Installe Lions Arena</div>
            <div style={{ fontSize:11, color:T.muted }}>Accès direct depuis ton écran d'accueil</div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {installable && <button onClick={handleInstall} style={{ background:A.gold, border:"none", color:"#000", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:800, cursor:"pointer" }}>Installer</button>}
            {!notifGranted && <button onClick={handleNotif} style={{ background:A.green+"22", border:`1px solid ${A.green}44`, color:A.green, borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:800, cursor:"pointer" }}>🔔</button>}
          </div>
        </div>
      )}

      {/* BODY */}
      <div ref={bodyRef} {...tabSwipe} style={{ flex:1, overflowY:"scroll", overflowX:"hidden", minHeight:0, padding:"16px 14px 100px", WebkitOverflowScrolling:"touch" }}>
        <Countdown T={T} />
        {tab===0 && <MatchesTab T={T} user={user} />}
        {tab===1 && <HistoryTab T={T} />}
        {tab===2 && <LegendsTab T={T} />}
        {tab===3 && <PronosticsTab T={T} user={user} />}
        {tab===4 && <AITab T={T} user={user} />}
        {tab===5 && <CommunityTab T={T} user={user} />}
      </div>

      {/* BOTTOM NAV — rétrécit comme Instagram au scroll */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:500,
        display:"flex", justifyContent:"center",
        padding:`0 0 calc(env(safe-area-inset-bottom, 10px) + 6px)`,
        background:"transparent", pointerEvents:"none",
        transition:"all 0.3s ease",
      }}>
        <div style={{
          display:"flex", alignItems:"center",
          background: navShrunk ? T.header+"EE" : T.header,
          backdropFilter:"blur(24px)",
          borderTop: navShrunk ? "none" : `1px solid ${T.border}`,
          borderRadius: navShrunk ? 40 : 0,
          padding: navShrunk ? "6px 10px" : `8px 0`,
          gap: navShrunk ? 4 : 0,
          width: navShrunk ? "auto" : "100%",
          boxShadow: navShrunk ? "0 4px 30px rgba(0,0,0,0.5)" : "none",
          transition:"all 0.35s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents:"all",
        }}>
          {TABS.map(([key,lbl],i)=>{
            const isActive = tab===i;
            const iconColor = isActive ? A.gold : T.muted;
            return (
              <button key={i} onClick={()=>changeTab(i)} style={{
                flex: navShrunk ? "none" : 1,
                background: navShrunk && isActive ? A.gold+"22" : "transparent",
                border:"none", cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"center",
                gap: navShrunk ? 0 : 3,
                padding: navShrunk ? "8px 14px" : "6px 0 2px",
                borderRadius: navShrunk ? 30 : 0,
                transition:"all 0.3s ease",
                minWidth: navShrunk ? 44 : "auto",
              }}>
                <div style={{ opacity: isActive ? 1 : 0.55, transition:"opacity 0.2s, transform 0.2s", transform: isActive ? "scale(1.08)" : "scale(1)" }}>
                  {NAV_ICONS[key]?.(isActive, iconColor)}
                </div>
                {!navShrunk && <span style={{ fontSize:9, color:iconColor, fontWeight:900, letterSpacing:0.8, transition:"color 0.2s" }}>{lbl.toUpperCase()}</span>}
                {!navShrunk && isActive && <div style={{ width:16, height:2, borderRadius:1, background:A.gold, marginTop:1 }} />}
                {navShrunk && isActive && <div style={{ width:4, height:4, borderRadius:"50%", background:A.gold, marginTop:2 }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
