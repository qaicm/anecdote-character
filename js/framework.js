/*
 * framework.js — kerangka karakter sekolah (5 nilai, 23 sub-nilai), contoh, dan logika
 * penyusunan teks. Tidak menyentuh DOM, sehingga bisa diuji terpisah.
 * Kunci sub-nilai HARUS sama dengan SUB_VALUE di Kode.gs.
 */
/* Five values (report order) and their sub-values.
   ek: strength (noun phrase) · ep: area for development (gerund phrase) · es: recommendation (base verb)
   ee: extension of a strength (base verb) · tt: teacher strategy · pt: parent strategy */
const VALUES=[
 {id:"faithful",name:"Faithful",full:"Faithful / Taqwa",ar:"التقوى",sec:"sp",focus:"Taqwa provides a framework of values that gives direction and meaning, and offers emotional and spiritual stability in facing various situations."},
 {id:"akhlaq",name:"Akhlaq-Adab",full:"Adab-Akhlaq",ar:"الأدب والأخلاق",sec:"sp",focus:"Adab is the foundation of good conduct based on the Qur'an and Hadith, enabling students to respect the rights and dignity of others and maintain harmonious relationships."},
 {id:"intel",name:"Intelligence",full:"Intelligence / Al-Dzaka",ar:"الذكاء",sec:"so",focus:"The cognitive and mental capacity to understand, learn, solve problems and adapt to the environment."},
 {id:"indep",name:"Independence",full:"Independence / Al-Istiqlaliyah",ar:"الاستقلالية",sec:"so",focus:"Independence enables students to take responsibility for their lives, build self-confidence and overcome obstacles without depending on others."},
 {id:"lead",name:"Leadership",full:"Leadership / Al-Qiyadah",ar:"القيادة",sec:"so",focus:"Effective leadership brings positive change, motivates others and creates an inclusive and productive environment."}
];
const SUB={
 worship:{v:"faithful",n:"Worship",id:"Ibadah",def:"Performs acts of worship consistently and with sincere devotion to God.",
  ek:"consistency and sincerity in worship",ep:"developing focus and consistency in worship",
  es:"take a small role in congregational prayer or du'a so that worship becomes {his} own habit",ee:"continue to be a role model in worship for {his} peers",
  tt:"Assign a small role in congregational prayer, such as leading the du'a or straightening the rows.",pt:"Keep a simple daily worship log together and acknowledge consistency."},
 obedience:{v:"faithful",n:"Obedience",id:"Ketaatan",def:"Carries out God's commands and religious teachings with full compliance.",
  ek:"a sincere commitment to following religious teachings",ep:"learning to follow religious guidance without repeated reminders",
  es:"connect each religious practice with its reason so that obedience grows from understanding",ee:"help {his} peers understand the reasons behind religious practices",
  tt:"Briefly explain the reason behind each religious practice before it is carried out.",pt:"Discuss one verse or hadith each week and relate it to daily routines."},
 piety:{v:"faithful",n:"Piety",id:"Ketakwaan",def:"Maintains a strong relationship with God and lives in accordance with religious teachings.",
  ek:"a strong awareness of God in {his} daily conduct",ep:"learning to apply religious values in {his} daily conduct",
  es:"reflect daily on one action and how it reflects {his} faith",ee:"share short reflections on faith during morning assemblies",
  tt:"Provide brief reflection moments at the end of the day that link actions to religious values.",pt:"Model and discuss how faith guides family decisions."},
 gratitude:{v:"faithful",n:"Gratitude",id:"Syukur",def:"Expresses gratitude for every blessing given by God.",
  ek:"a grateful attitude toward the blessings {he} receives",ep:"learning to express gratitude rather than complaint",
  es:"keep a short gratitude journal and say alhamdulillah for daily blessings",ee:"lead the class in sharing daily gratitude",
  tt:"Occasionally open lessons with a one-minute gratitude sharing.",pt:"Share three things the family is grateful for at dinner."},
 respect:{v:"akhlaq",n:"Respect",id:"Penghargaan",def:"Respects and values the rights and dignity of others.",
  ek:"respect for the rights and dignity of others",ep:"learning to respond respectfully to the opinions and mistakes of others",
  es:"practise responding to others with respectful phrases such as \"I see it differently because...\"",ee:"model respectful discussion for {his} peers",
  tt:"Agree on respectful discussion phrases with the class and acknowledge their use.",pt:"Model respectful disagreement at home and point it out when it happens."},
 courtesy:{v:"akhlaq",n:"Courtesy",id:"Sopan santun",def:"Behaves politely and respectfully in interactions with others.",
  ek:"polite and courteous manners in daily interactions",ep:"learning to use polite words and manners consistently",
  es:"use the polite words please, thank you and sorry consistently",ee:"welcome guests and new students on behalf of the class",
  tt:"Acknowledge polite expressions specifically whenever they are used.",pt:"Use and expect the words please, thank you and sorry at home."},
 humility:{v:"akhlaq",n:"Humility",id:"Kerendahan hati",def:"Acknowledges personal limitations and remains humble.",
  ek:"humility in acknowledging {his} limitations and accepting input",ep:"learning to accept feedback and acknowledge {his} mistakes",
  es:"practise receiving feedback by restating it and naming one improvement",ee:"support {his} peers while giving them credit for their ideas",
  tt:"Use a simple feedback routine: listen, restate and name one improvement.",pt:"Share your own mistakes and what you learned from them."},
 tolerance:{v:"akhlaq",n:"Tolerance",id:"Toleransi",def:"Accepts differences and respects the views and beliefs of others.",
  ek:"an open and accepting attitude toward differences",ep:"learning to accept views and habits that differ from {his} own",
  es:"work regularly in mixed groups and identify one strength in each member",ee:"help bridge differences when working in diverse groups",
  tt:"Rotate group membership and ask each member to note a peer's strength.",pt:"Discuss differences among relatives and neighbours in a positive light."},
 care:{v:"akhlaq",n:"Care",id:"Perhatian",def:"Shows concern for the needs and feelings of others.",
  ek:"genuine care for the needs and feelings of others",ep:"learning to notice and respond to the needs of others",
  es:"take on a weekly buddy role to notice and help a classmate",ee:"act as a buddy for new or struggling classmates",
  tt:"Assign a rotating buddy role and discuss how others might feel.",pt:"Involve {him} in small acts of care, such as checking on a sick relative."},
 responsibility:{v:"indep",n:"Responsibility",id:"Tanggung jawab",def:"Takes responsibility for personal actions and decisions.",
  ek:"responsibility for {his} own tasks and belongings",ep:"learning to manage {his} tasks and belongings without reminders",
  es:"use a daily checklist and break long tasks into smaller deadlines",ee:"hold a regular class responsibility",
  tt:"Provide a daily checklist and reduce verbal reminders gradually.",pt:"Let {him} prepare {his} school bag the night before using the same checklist."},
 risk:{v:"indep",n:"Risk-Taking",id:"Pengambilan risiko",def:"Dares to take risks in pursuing goals and personal growth.",
  ek:"the courage to attempt new challenges",ep:"building the courage to attempt unfamiliar tasks",
  es:"attempt one new challenge each week, with effort acknowledged over results",ee:"take on tasks slightly beyond {his} current level",
  tt:"Offer optional challenge tasks and praise the attempt, not only the outcome.",pt:"Encourage a new activity and celebrate the attempt, whatever the result."},
 confidence:{v:"indep",n:"Self-confidence",id:"Percaya diri",def:"Believes in personal ability to face challenges and overcome obstacles.",
  ek:"confidence in {his} own abilities",ep:"building confidence to speak and perform in front of others",
  es:"share ideas in small groups first, using prepared sentence starters, before presenting to the class",ee:"present {his} work to wider audiences",
  tt:"Allow small-group sharing before whole-class presentations and provide sentence starters.",pt:"Let {him} order food or ask for help in public places."},
 resilience:{v:"indep",n:"Resilience",id:"Daya tahan",def:"Endures and recovers from difficulties or failures.",
  ek:"resilience in recovering from setbacks",ep:"learning to recover from setbacks and continue working",
  es:"follow a simple recovery plan after a setback: pause, name the feeling and choose the next step",ee:"share how {he} has overcome setbacks to encourage {his} peers",
  tt:"Discuss disappointing results privately and focus on concrete next steps.",pt:"Praise effort and strategy rather than results, and share stories of perseverance."},
 selfcontrol:{v:"indep",n:"Self-Control",id:"Pengendalian diri",def:"Controls emotions, desires and behaviour in difficult situations.",
  ek:"the ability to control {his} emotions and behaviour",ep:"developing self-control in managing {his} emotions and impulses",
  es:"use an agreed calming strategy, such as taking five deep breaths, and wait for a signal before speaking",ee:"model calm behaviour in challenging situations",
  tt:"Agree on a calming strategy and a turn-taking signal, and acknowledge each success.",pt:"Name feelings together and practise the same calming strategy at home."},
 adaptability:{v:"intel",n:"Adaptability",id:"Ketangkasan",def:"Adjusts to changes in the environment or situation.",
  ek:"the ability to adapt well to new situations",ep:"learning to adjust to changes in routine",
  es:"preview changes in routine in advance and reflect afterwards on how {he} adapted",ee:"help {his} peers adjust to changes in the classroom",
  tt:"Announce changes in advance and use a visual schedule.",pt:"Prepare {him} for upcoming changes by talking them through beforehand."},
 critical:{v:"intel",n:"Critical Thinking",id:"Berpikir kritis",def:"Analyses information critically and logically.",
  ek:"strong critical thinking and thoughtful questioning",ep:"learning to examine information carefully before drawing conclusions",
  es:"practise asking \"How do we know?\" and supporting {his} answers with reasons",ee:"lead class discussions with open-ended questions",
  tt:"Ask follow-up questions such as \"Why do you think so?\" and expect reasons.",pt:"Discuss news or stories together and ask for the reasons behind opinions."},
 problem:{v:"intel",n:"Problem-solving",id:"Pemecahan masalah",def:"Identifies, formulates and solves problems.",
  ek:"effective problem-solving skills",ep:"learning to persevere when solving challenging problems",
  es:"break difficult problems into smaller steps and try more than one strategy",ee:"explain {his} problem-solving strategies to {his} peers",
  tt:"Model step-by-step problem-solving and celebrate each step completed.",pt:"Involve {him} in solving small household problems."},
 creative:{v:"intel",n:"Creative-Innovation",id:"Kreatif-inovatif",def:"Thinks creatively and generates new or innovative solutions.",
  ek:"creativity in producing original ideas and solutions",ep:"developing creative thinking beyond familiar approaches",
  es:"take part in open-ended projects and brainstorming activities",ee:"lead brainstorming sessions and design projects",
  tt:"Provide open-ended tasks with more than one acceptable answer.",pt:"Offer simple materials for building or drawing without fixed instructions."},
 integrity:{v:"lead",n:"Integrity",id:"Integritas",def:"Upholds honesty and high moral standards in actions and decisions.",
  ek:"honesty and integrity in {his} words and actions",ep:"learning to remain honest and consistent, even when it is difficult",
  es:"reflect on honest choices through short discussions, with acknowledgement whenever {he} tells the truth",ee:"be entrusted with responsibilities that require honesty",
  tt:"Acknowledge honesty explicitly, especially when the truth is difficult to tell.",pt:"Respond calmly to admissions of mistakes so that honesty feels safe."},
 influence:{v:"lead",n:"Influence",id:"Pengaruh",def:"Influences and inspires others to act toward a shared goal.",
  ek:"a positive influence that inspires {his} peers",ep:"learning to influence {his} peers in a positive direction",
  es:"lead small positive initiatives, such as a class cleanliness campaign",ee:"lead a class initiative that involves {his} peers",
  tt:"Give opportunities to lead small class initiatives.",pt:"Discuss role models and how they influence others positively."},
 optimism:{v:"lead",n:"Optimism",id:"Optimisme",def:"Maintains a positive attitude and confidence in facing challenges.",
  ek:"a positive and optimistic attitude toward challenges",ep:"developing a positive outlook when facing difficulties",
  es:"reframe each difficulty by naming one possible next step",ee:"encourage {his} peers to stay positive during difficult tasks",
  tt:"Model positive self-talk and highlight progress over time.",pt:"Share stories of challenges that turned out well."},
 decision:{v:"lead",n:"Decision Making",id:"Pengambilan keputusan",def:"Makes wise and effective decisions.",
  ek:"sound and well-considered decision-making",ep:"learning to consider options before making decisions",
  es:"list two options and their consequences before making a decision",ee:"make decisions on behalf of {his} group",
  tt:"Offer structured choices and ask {him} to explain the reason for each choice.",pt:"Involve {him} in age-appropriate family decisions."},
 communication:{v:"lead",n:"Communication",id:"Komunikasi",def:"Conveys messages clearly and effectively, and listens well.",
  ek:"clear and effective communication",ep:"learning to express ideas clearly and to listen attentively",
  es:"practise expressing ideas in complete sentences and paraphrasing what others say",ee:"take on storytelling or presentation tasks slightly beyond {his} current level",
  tt:"Use think-pair-share and paraphrasing routines.",pt:"Talk daily about {his} school day using open questions."}
};
const VAL=Object.fromEntries(VALUES.map(v=>[v.id,v]));
const LEVELS=["Excellent","Very Good","Good","Need Improvement"];
const JUDGE=["naughty","lazy","smart","clever","stupid","rude","good boy","good girl","shy","spoiled","stubborn","hyperactive","selfish","slow","mean","bossy","nakal","malas","bandel","pintar","bodoh","cengeng","manja","pemalu","keras kepala","egois"];

const EXAMPLES=[
 {student:{name:"Mabel",cls:"KG B",gender:"f"},label:"Example from the slide",
  notes:[
   {date:"2026-02-06",time:"Snack time",loc:"Classroom",aspect:"communication",type:"k",what:"While writing her name on the snack jobs chart for the next day, Mabel told Anna, “I start Mabel with a big M.”",end:"She finished writing her name and pointed out the letter M to Anna."},
   {date:"2026-02-09",time:"Circle time",loc:"Classroom carpet",aspect:"selfcontrol",type:"p",what:"While Dio was talking about his holiday, Mabel interrupted three times to talk about her cat.",end:"The teacher gave a hand signal; at the next turn Mabel waited until Dio had finished."},
   {date:"2026-02-10",time:"Lesson",loc:"Art corner",aspect:"problem",type:"k",what:"When the glue stick ran out, Mabel said, “We can use tape instead,” and fetched the tape from the shelf.",end:"Her group finished the collage on time."},
   {date:"2026-02-11",time:"Snack time",loc:"Classroom",aspect:"worship",type:"k",what:"Before eating, Mabel raised her hand and said, “May I lead the du'a?” She then recited the du'a before meals completely.",end:"Her classmates followed, and Mabel reminded Dio to raise his hands."},
   {date:"2026-02-12",time:"Break time",loc:"Playground",aspect:"care",type:"k",what:"When Dio fell off the tricycle, Mabel ran to him and asked, “Are you hurt? Let's go to the teacher.”",end:"She walked Dio to the teacher on duty and waited beside him."},
   {date:"2026-02-13",time:"Dismissal",loc:"Lockers",aspect:"responsibility",type:"k",what:"Mabel put on her shoes, fastened the straps and packed her water bottle without being reminded.",end:"While waiting to be picked up, she helped Anna find her lunch box."},
   {date:"2026-02-16",time:"Lesson",loc:"Block corner",aspect:"resilience",type:"p",what:"When her block tower collapsed, Mabel kicked the fallen blocks and cried loudly.",end:"After the teacher sat beside her and said, “You feel disappointed,” she stopped crying and began to rebuild."}],
  desc:{
   s:"Mabel communicates clearly and takes pride in writing her own name; she explained to a classmate that her name begins with a capital M (6 Feb). She solves practical problems independently, suggesting tape when the glue ran out (10 Feb). She is enthusiastic about worship and volunteered to lead the du'a before meals (11 Feb). She shows genuine care for others, comforting Dio after he fell (12 Feb), and manages her belongings responsibly (13 Feb).",
   w:"Mabel is still developing self-control in waiting for her turn to speak; she interrupted a classmate three times during circle time (9 Feb). She is also learning to recover from setbacks; when her tower collapsed, she kicked the blocks and cried (16 Feb). In both cases she responded well once the teacher gave a signal or named her feelings.",
   g:"• At school: continue the turn-taking hand signal during circle time and acknowledge each time Mabel waits.\n• At school: help Mabel name her feelings (\"You feel disappointed because...\") and then choose a calming strategy, such as taking five deep breaths.\n• To build on her strengths: invite Mabel to write name labels for the classroom corners and to lead the du'a occasionally.\n• At home: practise turn-taking during family meals and praise effort rather than results."}},
 {student:{name:"Raka Pratama",cls:"1B",gender:"m"},label:"Primary school",
  notes:[
   {date:"2026-09-03",time:"Lesson",loc:"Classroom",aspect:"problem",type:"k",what:"While adding 8 + 5 with ice-cream sticks, Raka made two groups and said, “It can also be 10 plus 3, Ma'am.”",end:"He showed his method to his deskmate and used it for the next problem."},
   {date:"2026-09-05",time:"Arrival",loc:"Classroom",aspect:"responsibility",type:"p",what:"Raka left his bag on the floor and began to play. The teacher reminded him three times to take out his communication book.",end:"He took out the book after the third reminder, when his classmates had already started the morning prayer."},
   {date:"2026-09-08",time:"Congregational prayer",loc:"Prayer room",aspect:"worship",type:"p",what:"During the congregational Dhuha prayer, Raka nudged the classmate beside him and laughed during the second rak'ah.",end:"The teacher spoke to him quietly after the prayer, and Raka apologised to his classmate."},
   {date:"2026-09-10",time:"Group work",loc:"Classroom",aspect:"confidence",type:"p",what:"When asked to present his group's work, Raka looked down and whispered, “You do it.”",end:"A groupmate presented while Raka stood beside her holding the poster."},
   {date:"2026-09-11",time:"Break time",loc:"Playground",aspect:"influence",type:"k",what:"Raka saw Bima sitting alone and said to his team, “Let's ask Bima to join; we need one more player.”",end:"His teammates agreed, and Bima played with them until the bell rang."},
   {date:"2026-09-12",time:"Break time",loc:"Sports field",aspect:"care",type:"k",what:"Seeing Salsa struggling to carry the balls, Raka said, “Let me help you,” and carried half of them.",end:"They put the balls in the basket and played together."}],
  desc:{
   s:"Raka shows flexible problem-solving in mathematics; he found that 8 + 5 can be calculated as 10 + 3 and taught the method to his deskmate (3 Sep). He has a positive influence on his peers, persuading his team to include a classmate who was alone (11 Sep), and he shows care by helping others without being asked (12 Sep).",
   w:"Raka is still learning to manage his tasks without reminders; he needed three reminders to prepare his communication book (5 Sep). He is developing focus during congregational prayer (8 Sep) and is building the confidence to speak in front of the class (10 Sep).",
   g:"• At school: provide a picture checklist on Raka's desk for the morning routine and reduce verbal reminders gradually.\n• At school: give Raka a small role during congregational prayer, such as straightening the rows.\n• At school: let Raka explain his strategies in a small group first, then in front of the class with prepared sentence starters.\n• At home: let Raka prepare his school bag the night before using the same checklist."}},
 {student:{name:"Alya Rahmawati",cls:"7A",gender:"f"},label:"Secondary school",
  notes:[
   {date:"2026-08-20",time:"Group work",loc:"Laboratory",aspect:"decision",type:"k",what:"Alya assigned roles in her group: “You record, you measure the temperature, and I will hold the stopwatch.” She checked that everyone agreed.",end:"The group finished first, and every member had data on the worksheet."},
   {date:"2026-08-27",time:"Lesson",loc:"Science classroom",aspect:"critical",type:"k",what:"After the lesson on thermal expansion, Alya asked, “Then why are railway tracks given gaps, while power lines are left slack?”",end:"Her question led to a ten-minute class discussion."},
   {date:"2026-08-31",time:"Break time",loc:"Prayer room",aspect:"worship",type:"k",what:"When the lunch bell rang, Alya invited two friends: “Let's pray Zuhr first, then go to the canteen.”",end:"The three of them performed the Zuhr prayer in congregation on time."},
   {date:"2026-09-02",time:"Lesson",loc:"Mathematics classroom",aspect:"resilience",type:"p",what:"On receiving a quiz score of 55, Alya closed her book, put it in her bag and did not attempt the next exercise.",end:"She remained silent until the bell. When the teacher approached, she said, “It's pointless, Ma'am.”"},
   {date:"2026-09-09",time:"Lesson",loc:"Classroom",aspect:"respect",type:"p",what:"When Dimas gave an incorrect answer, Alya said loudly, “That's so obvious,” and several students laughed.",end:"Dimas did not volunteer another answer for the rest of the lesson."},
   {date:"2026-09-15",time:"Dismissal",loc:"Classroom",aspect:"responsibility",type:"p",what:"Alya submitted her poster project two days after the deadline, the second late submission this month.",end:"She explained that she had started the project the day before it was due."}],
  desc:{
   s:"Alya makes sound decisions as a group leader; she assigned roles clearly and ensured that every member agreed (20 Aug). She thinks critically and connects concepts to real-world situations, prompting a class discussion (27 Aug). She is consistent in worship and encourages her friends to pray on time (31 Aug).",
   w:"Alya is still learning to recover from setbacks; after a low quiz score she stopped working and said it was pointless (2 Sep). She is learning to respond respectfully to the mistakes of others (9 Sep) and to manage long-term tasks, as her project was submitted late twice (15 Sep).",
   g:"• At school: discuss low results privately, focus on concrete next steps and offer a clear opportunity for remedial work.\n• At school: agree on respectful discussion phrases and acknowledge Alya when she uses them.\n• At school: help Alya break projects into smaller deadlines and review her progress midway.\n• To build on her strengths: give Alya a group leader role that includes managing the group's schedule.\n• At home: praise effort and strategy rather than scores."}}
];

/* ---------- formatting helpers ---------- */
const MON=["January","February","March","April","May","June","July","August","September","October","November","December"];
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const sdate=d=>{if(!d)return"";const[y,m,dd]=String(d).split("-");return `${+dd} ${MON[+m-1].slice(0,3)}`};
const longdate=d=>{if(!d)return"";const[y,m,dd]=String(d).split("-");return `${MON[+m-1]} ${String(dd).padStart(2,"0")}, ${y}`};
const first=n=>(n||"The student").trim().split(/\s+/)[0];
const lower=s=>s?s.charAt(0).toLowerCase()+s.slice(1):s;
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
const uniq=a=>[...new Set(a)];
const todayISO=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const subLabel=k=>SUB[k]?`${VAL[SUB[k].v].name} · ${SUB[k].n}`:k;
function joinList(a){return a.length<2?a.join(""):a.slice(0,-1).join(", ")+" and "+a[a.length-1]}
function andList(a){return a.length<2?a.join(""):a.slice(0,-1).join(", ")+", as well as "+a[a.length-1]}

/* ---------- pronouns ---------- */
function pron(gender,name){
  const f=first(name);
  if(gender==="m")return{he:"he",He:"He",his:"his",him:"him"};
  if(gender==="f")return{he:"she",He:"She",his:"her",him:"her"};
  return{he:f,He:f,his:f+"'s",him:f};
}
const fill=(s,P)=>s.replace(/\{(he|He|his|him)\}/g,(m,k)=>P[k]);

/* ---------- grading ----------
   notes: [{aspect,type}] · returns suggested level for one value */
function autoGrade(notes,vid){
  const ns=notes.filter(n=>SUB[n.aspect]?.v===vid);
  const k=ns.filter(n=>n.type==="k").length,p=ns.length-k;
  let g=null;
  if(k>=2&&!p)g="Excellent";else if(k&&!p)g="Very Good";else if(k&&p)g="Good";else if(p)g="Need Improvement";
  return{g,k,p};
}
/* overrides keyed by value name, e.g. {Faithful:"Good"} */
function gradesFor(notes,overrides){
  const out={};
  VALUES.forEach(v=>{const a=autoGrade(notes,v.id),o=(overrides||{})[v.name];out[v.id]={level:o||a.g,auto:!o,...a}});
  return out;
}

/* ---------- report narratives (Social = so, Spiritual = sp) ---------- */
function narrative(notes,student,sec){
  const ns=notes.filter(n=>SUB[n.aspect]&&VAL[SUB[n.aspect].v].sec===sec);
  if(!ns.length)return"";
  const P=pron(student.gender,student.name);
  const nm=sec==="so"?(student.name||"The student").trim():first(student.name);
  const K=ns.filter(n=>n.type==="k"),W=ns.filter(n=>n.type==="p");
  const kA=uniq(K.map(n=>n.aspect)).slice(0,3),wA=uniq(W.map(n=>n.aspect)).slice(0,2);
  const out=[];
  if(kA.length){
    out.push(`${sec==="sp"?"Masyaallah, ":""}${nm} has been demonstrating ${andList(kA.map(a=>fill(SUB[a].ek,P)))} this term (${joinList(kA.map(a=>SUB[a].n))}; observed on ${joinList(K.map(n=>sdate(n.date)))}).`);
  }
  if(wA.length){
    const subj=kA.length?P.he:nm;
    out.push(cap(`${kA.length?"However, ":""}${subj} is still ${wA.map(a=>fill(SUB[a].ep,P)).join(", as well as ")} (${joinList(wA.map(a=>SUB[a].n))}; ${joinList(W.map(n=>sdate(n.date)))}).`));
    out.push(`Therefore, ${P.he} is encouraged to ${fill(SUB[wA[0]].es,P)}.`);
    if(wA[1])out.push(`${P.He} is also encouraged to ${fill(SUB[wA[1]].es,P)}.`);
  }else if(kA.length){
    out.push(`To grow further, ${P.he} is encouraged to ${fill(SUB[kA[0]].ee,P)}.`);
  }
  return out.join(" ");
}

/* ---------- Step 2 character description ---------- */
function draftDescription(notes,student){
  const nm=first(student.name),P=pron(student.gender,student.name);
  const group=list=>{const g={};list.forEach(n=>(g[n.aspect]=g[n.aspect]||[]).push(n));return g};
  const K=group(notes.filter(n=>n.type==="k")),W=group(notes.filter(n=>n.type==="p"));
  const ev=n=>`${sdate(n.date)}${n.loc?", "+lower(n.loc):""}: ${String(n.what).replace(/\s+$/,"")}`;
  const s=Object.entries(K).map(([a,ns])=>`${nm} demonstrates ${fill(SUB[a].ek,P)} (${subLabel(a)}). Evidence (${ev(ns[0])}${ns.length>1?` Also observed on ${ns.slice(1).map(x=>sdate(x.date)).join(", ")}.`:""})`).join("\n\n");
  const w=Object.entries(W).map(([a,ns])=>`${nm} is still ${fill(SUB[a].ep,P)} (${subLabel(a)}). Evidence (${ev(ns[0])}${ns[0].end?" "+ns[0].end:""})`).join("\n\n");
  const g=[];
  Object.keys(W).forEach(a=>g.push(`• At school (${SUB[a].n}): ${fill(SUB[a].tt,P)}`));
  Object.keys(K).slice(0,2).forEach(a=>g.push(`• To build on ${P.his} strength in ${SUB[a].n}: encourage ${P.him} to ${fill(SUB[a].ee,P)}.`));
  Object.keys(W).forEach(a=>g.push(`• At home (${SUB[a].n}): ${fill(SUB[a].pt,P)}`));
  return{s,w,g:g.join("\n")};
}

/* ---------- quality checks on the final report ---------- */
function qualityChecks(d,student,notes){
  const C=[],add=(ok,t)=>C.push({ok,t});
  const txt=(d.social||"")+" "+(d.spirit||""),f=first(student.name);
  if(!student.name)add(false,"The student's name is missing.");
  else{
    const ok=!txt.trim()||new RegExp("\\b"+f.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b").test(txt);
    add(ok,ok?`The narratives use the name ${f}.`:`The name ${f} does not appear in the narratives. The text may have been copied from another student.`);
  }
  const ph=txt.match(/\b(Fulan|Fulanah|Fulana|XXX|EXAMPLE|Student Name)\b/i);
  add(!ph,ph?`A placeholder name, “${ph[0]}”, remains. Replace it with the student's name.`:"No placeholder names (such as Fulan or Fulanah) remain.");
  if(!student.gender)add(false,"Gender has not been set for this student, so pronouns cannot be checked.");
  else{
    const wrong=student.gender==="m"?/\b(she|her|hers|herself)\b/i:/\b(he|him|his|himself)\b/i,m=txt.match(wrong);
    add(!m,m?`The pronoun “${m[0]}” does not match a ${student.gender==="m"?"male":"female"} student.`:`Pronouns are consistent (${student.gender==="m"?"he/his":"she/her"}).`);
  }
  [["Social",d.social||""],["Spiritual",d.spirit||""]].forEach(([n,t])=>{
    if(!t.trim()){add(false,`The ${n} narrative is empty. Select “Draft narratives from records” or write it yourself.`);return}
    const w=t.trim().split(/\s+/).length;
    add(w>=35&&w<=130,w<35?`The ${n} narrative is too short (${w} words). Aim for 40–120 words.`:w>130?`The ${n} narrative is too long (${w} words). Reduce it to 40–120 words.`:`The ${n} narrative is an appropriate length (${w} words).`);
    const hasW=/\b(however|still|developing|learning to)\b/i.test(t),hasS=/\b(therefore|encouraged|is advised|should|will help)\b/i.test(t);
    add(hasW&&hasS,hasW&&hasS?`The ${n} narrative includes strengths, areas for development and recommendations.`:`The ${n} narrative does not yet include ${!hasW?"an area for development (However …)":""}${!hasW&&!hasS?" or ":""}${!hasS?"a recommendation (Therefore …)":""}.`);
    const ev=/\b(\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|observed|for example|for instance|when)\b/i.test(t);
    add(ev,ev?`The ${n} narrative refers to evidence.`:`The ${n} narrative does not refer to a specific incident. Add one example from the anecdotal records.`);
  });
  const miss=VALUES.filter(v=>!d.grades[v.id].level).map(v=>v.name);
  add(!miss.length,miss.length?`No grade yet for ${joinList(miss)}. Add a record under one of its sub-values or select a grading cell.`:"All five values have been graded.");
  const low=txt.toLowerCase();
  VALUES.forEach(v=>{
    const g=d.grades[v.id];
    if(g.level==="Excellent"&&g.p)add(false,`${v.name} is graded Excellent although ${g.p} area${g.p>1?"s":""} for development ${g.p>1?"were":"was"} recorded. Please review the grade.`);
    if(g.level==="Need Improvement"&&g.k&&!g.p)add(false,`${v.name} is graded Need Improvement although all of its records show strengths.`);
    if(g.level&&!g.auto&&!g.k&&!g.p)add(false,`The ${v.name} grade was set without any supporting record. Add at least one record.`);
    if(g.level==="Need Improvement"&&low.trim()){
      const subs=Object.values(SUB).filter(s=>s.v===v.id);
      const hit=subs.some(s=>low.includes(s.n.toLowerCase())||low.includes(s.ep.replace(/\{[a-z]+\}/gi,"").toLowerCase().split(" ").slice(0,3).join(" ")));
      if(!hit)add(false,`${v.name} is graded Need Improvement but is not discussed in the narratives. Explain the relevant sub-value and give a recommendation.`);
    }
  });
  const sp=txt.match(/\b(intellegence|independance|responsibilty|behaviours? is|activitys|childs|due (he|she) needs)\b/i);
  if(sp)add(false,`Check the spelling or grammar of “${sp[0]}”.`);
  if(/throughout the (academic|school) year/i.test(txt)&&String(d.sem)==="1")add(false,"The narrative refers to the whole academic year, but this is a Semester 1 report. Use “this term” instead.");
  C.sort((a,b)=>a.ok-b.ok);
  return C;
}
