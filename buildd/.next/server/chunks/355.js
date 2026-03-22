exports.id=355,exports.ids=[355],exports.modules={6487:()=>{},7319:(e,a,i)=>{"use strict";i.d(a,{dI:()=>u,Uv:()=>P,No:()=>X,ff:()=>A,UZ:()=>U,LM:()=>F,w0:()=>h,jT:()=>D,Ir:()=>I,R9:()=>B,Rf:()=>R,CV:()=>k,Mc:()=>v,Lh:()=>M,t1:()=>_,rC:()=>O,sA:()=>d,eZ:()=>L,Ns:()=>C,qc:()=>x,Gk:()=>f,n8:()=>S});var t=i(7550),n=i.n(t),l=i(3873),o=i.n(l);let c=[{id:"brinjal",name:"Brinjal",englishName:"",nicknames:[],emoji:"\uD83C\uDF46",defaultPrice:30},{id:"tomato",name:"Tomato",englishName:"",nicknames:[],emoji:"\uD83C\uDF45",defaultPrice:25},{id:"potato",name:"Potato",englishName:"",nicknames:[],emoji:"\uD83E\uDD54",defaultPrice:20},{id:"onion",name:"Onion",englishName:"",nicknames:[],emoji:"\uD83E\uDDC5",defaultPrice:35},{id:"carrot",name:"Carrot",englishName:"",nicknames:[],emoji:"\uD83E\uDD55",defaultPrice:40},{id:"beans",name:"Beans",englishName:"",nicknames:[],emoji:"\uD83E\uDED8",defaultPrice:60},{id:"bitter-gourd",name:"Bitter Gourd",englishName:"",nicknames:[],emoji:"\uD83E\uDD52",defaultPrice:45},{id:"drumstick",name:"Drumstick",englishName:"",nicknames:[],emoji:"\uD83C\uDF3F",defaultPrice:80},{id:"cabbage",name:"Cabbage",englishName:"",nicknames:[],emoji:"\uD83E\uDD6C",defaultPrice:25},{id:"cauliflower",name:"Cauliflower",englishName:"",nicknames:[],emoji:"\uD83E\uDD66",defaultPrice:35},{id:"lady-finger",name:"Lady Finger",englishName:"",nicknames:[],emoji:"\uD83D\uDC4C",defaultPrice:50},{id:"raw-banana",name:"Raw Banana",englishName:"",nicknames:[],emoji:"\uD83C\uDF4C",defaultPrice:30},{id:"yam",name:"Yam",englishName:"",nicknames:[],emoji:"\uD83C\uDF60",defaultPrice:40},{id:"pumpkin",name:"Pumpkin",englishName:"",nicknames:[],emoji:"\uD83C\uDF83",defaultPrice:20},{id:"cluster-beans",name:"Cluster Beans",englishName:"",nicknames:[],emoji:"\uD83E\uDEDB",defaultPrice:55},{id:"flat-beans",name:"Flat Beans",englishName:"",nicknames:[],emoji:"\uD83E\uDED8",defaultPrice:50},{id:"cucumber",name:"Cucumber",englishName:"",nicknames:[],emoji:"\uD83E\uDD52",defaultPrice:25},{id:"corn",name:"Corn",englishName:"",nicknames:[],emoji:"\uD83C\uDF3D",defaultPrice:30},{id:"radish",name:"Radish",englishName:"",nicknames:[],emoji:"\uD83C\uDF38",defaultPrice:20},{id:"green-chilli",name:"Green Chilli",englishName:"",nicknames:[],emoji:"\uD83C\uDF36️",defaultPrice:100}],r={tagline:"",name:"Kaikari Kadai",subtitle:"Vegetable Order Supplier",address:"",contact1Name:"",contact1Phone:"",contact2Name:"",contact2Phone:"",billTitle:"விற்பனை பில்",logoLeft:"",logoRight:""},m=process.env.DB_PATH||o().join(process.cwd(),"database.db"),s=null;function E(){return s||((s=new(n())(m)).pragma("journal_mode = WAL"),s.pragma("foreign_keys = ON"),function(e){for(let a of(e.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      nickname TEXT DEFAULT '',
      code INTEGER,
      prefix TEXT DEFAULT 'திரு',
      pending_balance REAL DEFAULT 0,
      photo TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vegetables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      english_name TEXT DEFAULT '',
      nicknames TEXT DEFAULT '[]',
      emoji TEXT DEFAULT '',
      default_price REAL DEFAULT 0,
      code INTEGER
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      bill_number INTEGER NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_nickname TEXT DEFAULT '',
      customer_prefix TEXT DEFAULT 'திரு',
      date TEXT NOT NULL,
      subtotal REAL DEFAULT 0,
      coolie REAL DEFAULT 0,
      previous_balance REAL DEFAULT 0,
      total_due REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      new_balance REAL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY,
      bill_id TEXT NOT NULL,
      vegetable_id TEXT NOT NULL,
      vegetable_name TEXT NOT NULL,
      description TEXT,
      emoji TEXT DEFAULT '',
      price_per_kg REAL NOT NULL,
      total_weight REAL NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bill_sacks (
      id TEXT PRIMARY KEY,
      bill_item_id TEXT NOT NULL,
      weight REAL NOT NULL,
      FOREIGN KEY (bill_item_id) REFERENCES bill_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('bill_counter', '1000');
  `),function(e){let a=e.prepare("PRAGMA table_info(customers)").all().map(e=>e.name);a.includes("nickname")||e.exec("ALTER TABLE customers ADD COLUMN nickname TEXT DEFAULT ''"),a.includes("code")||e.exec("ALTER TABLE customers ADD COLUMN code INTEGER"),a.includes("prefix")||e.exec("ALTER TABLE customers ADD COLUMN prefix TEXT DEFAULT 'திரு'"),a.includes("photo")||e.exec("ALTER TABLE customers ADD COLUMN photo TEXT"),e.prepare("PRAGMA table_info(vegetables)").all().map(e=>e.name).includes("code")||e.exec("ALTER TABLE vegetables ADD COLUMN code INTEGER");let i=e.prepare("PRAGMA table_info(bills)").all().map(e=>e.name);i.includes("customer_nickname")||e.exec("ALTER TABLE bills ADD COLUMN customer_nickname TEXT DEFAULT ''"),i.includes("customer_prefix")||e.exec("ALTER TABLE bills ADD COLUMN customer_prefix TEXT DEFAULT 'திரு'"),i.includes("coolie")||e.exec("ALTER TABLE bills ADD COLUMN coolie REAL DEFAULT 0"),i.includes("vadakai")||e.exec("ALTER TABLE bills ADD COLUMN vadakai REAL DEFAULT 0"),e.prepare("PRAGMA table_info(bill_items)").all().map(e=>e.name).includes("description")||e.exec("ALTER TABLE bill_items ADD COLUMN description TEXT")}(e),Object.keys(T))){let i=p[a];void 0!==i&&e.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run(a,i)}if(0===e.prepare("SELECT COUNT(*) as c FROM vegetables").get().c){let a=e.prepare("INSERT INTO vegetables (id, name, english_name, nicknames, emoji, default_price) VALUES (?, ?, ?, ?, ?, ?)");for(let e of c)a.run(e.id,e.name,e.englishName,JSON.stringify(e.nicknames),e.emoji,e.defaultPrice)}}(s)),s}function d(){return m}function u(){s&&(s.close(),s=null)}let T={tagline:"company_tagline",name:"company_name",subtitle:"company_subtitle",address:"company_address",contact1Name:"contact1_name",contact1Phone:"contact1_phone",contact2Name:"contact2_name",contact2Phone:"contact2_phone",billTitle:"bill_title",logoLeft:"logo_left",logoRight:"logo_right"},p={company_tagline:r.tagline,company_name:r.name,company_subtitle:r.subtitle,company_address:r.address,contact1_name:r.contact1Name,contact1_phone:r.contact1Phone,contact2_name:r.contact2Name,contact2_phone:r.contact2Phone,bill_title:r.billTitle,logo_left:r.logoLeft,logo_right:r.logoRight};function _(){let e=E(),a=Object.values(T),i=e.prepare(`SELECT key, value FROM settings WHERE key IN (${a.map(()=>"?").join(",")})`).all(...a),t={...p};for(let e of i)t[e.key]=e.value;return{tagline:t.company_tagline,name:t.company_name,subtitle:t.company_subtitle,address:t.company_address,contact1Name:t.contact1_name,contact1Phone:t.contact1_phone,contact2Name:t.contact2_name,contact2Phone:t.contact2_phone,billTitle:t.bill_title,logoLeft:t.logo_left,logoRight:t.logo_right}}function L(e){let a=E(),i=a.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");a.transaction(()=>{for(let[a,t]of Object.entries(T))i.run(t,e[a]??"")})()}function N(e){return{id:e.id,name:e.name,phone:e.phone??void 0,nickname:e.nickname||void 0,code:e.code??void 0,prefix:e.prefix||"திரு",pendingBalance:e.pending_balance,photo:e.photo||void 0,createdAt:e.created_at}}function g(e){return{id:e.id,name:e.name,englishName:e.english_name,nicknames:JSON.parse(e.nicknames||"[]"),emoji:e.emoji,defaultPrice:e.default_price,code:e.code??void 0}}function b(e,a,i){let t=new Map;for(let e of i)t.has(e.bill_item_id)||t.set(e.bill_item_id,[]),t.get(e.bill_item_id).push({id:e.id,weight:e.weight});let n=new Map;for(let e of a)n.has(e.bill_id)||n.set(e.bill_id,[]),n.get(e.bill_id).push({vegetableId:e.vegetable_id,vegetableName:e.vegetable_name,description:e.description||void 0,emoji:e.emoji,pricePerKg:e.price_per_kg,totalWeight:e.total_weight,amount:e.amount,sacks:t.get(e.id)||[]});return e.map(e=>({id:e.id,billNumber:e.bill_number,customerId:e.customer_id,customerName:e.customer_name,customerNickname:e.customer_nickname||void 0,customerPrefix:e.customer_prefix||"திரு",date:e.date,subtotal:e.subtotal,coolie:e.coolie||0,vadakai:e.vadakai||0,previousBalance:e.previous_balance,totalDue:e.total_due,amountPaid:e.amount_paid,newBalance:e.new_balance,createdAt:e.created_at,items:n.get(e.id)||[]}))}function R(){return E().prepare("SELECT * FROM customers ORDER BY name").all().map(N)}function A(e){return E().prepare("INSERT INTO customers (id, name, phone, nickname, code, prefix, pending_balance, photo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(e.id,e.name,e.phone??null,e.nickname??"",e.code??null,e.prefix??"திரு",e.pendingBalance,e.photo??null,e.createdAt),e}function f(e,a){let i=E();for(let[t,n]of Object.entries({name:a.name,phone:a.phone??null,nickname:a.nickname??null,code:a.code??null,prefix:a.prefix??null,pending_balance:a.pendingBalance,photo:a.photo}))void 0!==n&&i.prepare(`UPDATE customers SET ${t} = ? WHERE id = ?`).run(n,e)}function O(e){let a=E().prepare("SELECT * FROM customers WHERE id = ?").get(e);return a?N(a):null}function h(e){E().prepare("DELETE FROM customers WHERE id = ?").run(e)}function k(){return E().prepare("SELECT * FROM vegetables ORDER BY COALESCE(code, 9999), name").all().map(g)}function U(e){return E().prepare("INSERT INTO vegetables (id, name, english_name, nicknames, emoji, default_price, code) VALUES (?, ?, ?, ?, ?, ?, ?)").run(e.id,e.name,e.englishName,JSON.stringify(e.nicknames),e.emoji,e.defaultPrice,e.code??null),e}function S(e,a){let i=E();for(let[t,n]of Object.entries({name:a.name,english_name:a.englishName,nicknames:void 0!==a.nicknames?JSON.stringify(a.nicknames):void 0,emoji:a.emoji,default_price:a.defaultPrice,code:a.code??null}))void 0!==n&&i.prepare(`UPDATE vegetables SET ${t} = ? WHERE id = ?`).run(n,e)}function D(e){E().prepare("DELETE FROM vegetables WHERE id = ?").run(e)}function I(){let e=E(),a=e.prepare("SELECT * FROM bills ORDER BY created_at DESC").all();return b(a,e.prepare("SELECT * FROM bill_items").all(),e.prepare("SELECT * FROM bill_sacks").all())}function v(e){let a=E(),i=a.prepare("SELECT * FROM bills WHERE id = ?").get(e);if(!i)return null;let t=a.prepare("SELECT * FROM bill_items WHERE bill_id = ?").all(e),n=t.map(e=>e.id);return b([i],t,n.length?a.prepare(`SELECT * FROM bill_sacks WHERE bill_item_id IN (${n.map(()=>"?").join(",")})`).all(...n):[])[0]}function P(e){let a=E(),i=parseInt(a.prepare("SELECT value FROM settings WHERE key = ?").get("bill_counter").value)+1;a.prepare("UPDATE settings SET value = ? WHERE key = ?").run(String(i),"bill_counter");let t={...e,billNumber:i},n=a.prepare(`INSERT INTO bills (id, bill_number, customer_id, customer_name, customer_nickname, customer_prefix, date, subtotal, coolie, vadakai, previous_balance, total_due, amount_paid, new_balance, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),l=a.prepare("INSERT INTO bill_items (id, bill_id, vegetable_id, vegetable_name, description, emoji, price_per_kg, total_weight, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"),o=a.prepare("INSERT INTO bill_sacks (id, bill_item_id, weight) VALUES (?, ?, ?)");return a.transaction(()=>{for(let e of(n.run(t.id,t.billNumber,t.customerId,t.customerName,t.customerNickname??"",t.customerPrefix??"திரு",t.date,t.subtotal,t.coolie,t.vadakai??0,t.previousBalance,t.totalDue,t.amountPaid,t.newBalance,t.createdAt),t.items)){let a=crypto.randomUUID();for(let i of(l.run(a,t.id,e.vegetableId,e.vegetableName,e.description??null,e.emoji,e.pricePerKg,e.totalWeight,e.amount),e.sacks))o.run(i.id,a,i.weight)}})(),t}function F(e){E().prepare("DELETE FROM bills WHERE id = ?").run(e)}function C(e,a){let i=E(),t=v(e);if(!t)return null;let n={...t,...a},l=i.prepare("INSERT INTO bill_items (id, bill_id, vegetable_id, vegetable_name, description, emoji, price_per_kg, total_weight, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"),o=i.prepare("INSERT INTO bill_sacks (id, bill_item_id, weight) VALUES (?, ?, ?)");return i.transaction(()=>{for(let a of(i.prepare("DELETE FROM bill_items WHERE bill_id = ?").run(e),i.prepare(`
      UPDATE bills SET
        customer_id = ?, customer_name = ?, customer_nickname = ?, customer_prefix = ?,
        date = ?, subtotal = ?, coolie = ?, vadakai = ?,
        previous_balance = ?, total_due = ?, amount_paid = ?, new_balance = ?
      WHERE id = ?
    `).run(n.customerId,n.customerName,n.customerNickname??"",n.customerPrefix??"திரு",n.date,n.subtotal,n.coolie,n.vadakai??0,n.previousBalance,n.totalDue,n.amountPaid,n.newBalance,e),n.items)){let i=crypto.randomUUID();for(let t of(l.run(i,e,a.vegetableId,a.vegetableName,a.description??null,a.emoji,a.pricePerKg,a.totalWeight,a.amount),a.sacks))o.run(t.id,i,t.weight)}})(),v(e)}function j(e){return{id:e.id,customerId:e.customer_id,customerName:e.customer_name,amount:e.amount,date:e.date,note:e.note||"",createdAt:e.created_at}}function X(e){return E().prepare("INSERT INTO collections (id, customer_id, customer_name, amount, date, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(e.id,e.customerId,e.customerName,e.amount,e.date,e.note||"",e.createdAt),e}function M(e){return E().prepare("SELECT * FROM collections WHERE customer_id = ? ORDER BY created_at DESC").all(e).map(j)}function B(){return E().prepare("SELECT * FROM collections ORDER BY created_at DESC").all().map(j)}function x(e,a){let i=E(),t=i.prepare("SELECT * FROM collections WHERE id = ?").get(e);if(!t)return null;let n=a-t.amount;return i.transaction(()=>{i.prepare("UPDATE collections SET amount = ? WHERE id = ?").run(a,e),0!==n&&i.prepare("UPDATE customers SET pending_balance = pending_balance - ? WHERE id = ?").run(n,t.customer_id)})(),j(i.prepare("SELECT * FROM collections WHERE id = ?").get(e))}},8335:()=>{}};