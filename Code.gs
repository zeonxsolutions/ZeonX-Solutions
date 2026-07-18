const SHEET_NAME='Students';
const PROJECTS_SHEET='Projects';
const SETTINGS_SHEET='Settings';

function doGet(){return json({success:true,message:'ZeonX API is running'});}
function doPost(e){try{const req=JSON.parse(e.postData.contents||'{}');const action=req.action;if(!action)throw new Error('Action is required');const handlers={login,verify,getStudent,getStudents,addStudent,deleteStudent,addProject,submitProject,updateStatus,confirmPayment,approveProject,generateOfferLetter,generateCertificate,uploadDocument};if(!handlers[action])throw new Error('Unknown action');return json(handlers[action](req));}catch(err){return json({success:false,message:err.message});}}
function json(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
function ss(){return SpreadsheetApp.getActiveSpreadsheet();}
function sheet(name){const sh=ss().getSheetByName(name);if(!sh)throw new Error(name+' sheet not found. Run setupZeonX first.');return sh;}
function setupZeonX(){const book=ss();let s=book.getSheetByName(SHEET_NAME)||book.insertSheet(SHEET_NAME);s.clear();s.appendRow(['Intern ID','Name','Email','Password','Domain','Duration','Status','Required Projects','Completed Projects','Payment Status','Offer Letter URL','Certificate URL','Created At']);let p=book.getSheetByName(PROJECTS_SHEET)||book.insertSheet(PROJECTS_SHEET);p.clear();p.appendRow(['Intern ID','Student Name','Student Email','Project No','Project Title','GitHub URL','Status','Submitted At','Approved At']);let set=book.getSheetByName(SETTINGS_SHEET)||book.insertSheet(SETTINGS_SHEET);set.clear();set.appendRow(['Key','Value']);set.appendRow(['ADMIN_EMAIL','admin@zeonx.com']);set.appendRow(['ADMIN_PASSWORD','CHANGE_THIS_PASSWORD']);set.appendRow(['OFFER_TEMPLATE_ID','PASTE_GOOGLE_DOC_TEMPLATE_ID']);set.appendRow(['CERTIFICATE_TEMPLATE_ID','PASTE_GOOGLE_DOC_TEMPLATE_ID']);set.appendRow(['OUTPUT_FOLDER_ID','PASTE_GOOGLE_DRIVE_FOLDER_ID']);set.appendRow(['COMPANY_EMAIL','hr.zeonxsolutions@gmail.com']);return 'Setup complete';}
function settings(){const values=sheet(SETTINGS_SHEET).getDataRange().getValues().slice(1);return Object.fromEntries(values.filter(r=>r[0]).map(r=>[r[0],r[1]]));}
function rowsToObjects(sh){const v=sh.getDataRange().getValues();const h=v.shift();return v.filter(r=>r[0]).map((r,i)=>Object.fromEntries(h.map((k,j)=>[k,r[j]]))).map((o,i)=>({...o,_row:i+2}));}
function studentObject(o){const projects=rowsToObjects(sheet(PROJECTS_SHEET)).filter(p=>p['Intern ID']===o['Intern ID']).map(p=>({title:p['Project Title'],github:p['GitHub URL'],status:p.Status}));return{internId:o['Intern ID'],name:o.Name,email:o.Email,password:o.Password,domain:o.Domain,duration:o.Duration,status:o.Status,requiredProjects:Number(o['Required Projects']||2),completedProjects:Number(o['Completed Projects']||0),offerLetter:o['Offer Letter URL']||'',certificate:o['Certificate URL']||'',projects};}
function login(r){const cfg=settings();if(r.email===cfg.ADMIN_EMAIL&&r.password===cfg.ADMIN_PASSWORD)return{success:true,user:{role:'admin',name:'Administrator'}};const o=rowsToObjects(sheet(SHEET_NAME)).find(x=>String(x.Email).toLowerCase()===String(r.email).toLowerCase()&&String(x.Password)===String(r.password));if(!o)throw new Error('Invalid email or password');return{success:true,user:{...studentObject(o),role:'student'}};}
function verify(r){const o=findStudent(r.internId);return{success:true,student:studentObject(o)};}
function getStudent(r){return{success:true,student:studentObject(findStudent(r.internId))};}
function getStudents(){return{success:true,students:rowsToObjects(sheet(SHEET_NAME)).map(studentObject)};}
function findStudent(id){const o=rowsToObjects(sheet(SHEET_NAME)).find(x=>String(x['Intern ID']).toLowerCase()===String(id).toLowerCase());if(!o)throw new Error('Intern ID not found');return o;}
function addStudent(r){const s=r.student||{};if(!s.internId||!s.name||!s.email)throw new Error('Required student details are missing');if(rowsToObjects(sheet(SHEET_NAME)).some(x=>x['Intern ID']===s.internId))throw new Error('Intern ID already exists');const count=Math.max(2,Number(s.requiredProjects||2));sheet(SHEET_NAME).appendRow([s.internId,s.name,s.email,s.password||'student123',s.domain,s.duration,'Active',count,0,'Confirmed','','',new Date()]);for(let i=1;i<=count;i++)sheet(PROJECTS_SHEET).appendRow([s.internId,s.name,s.email,i,'Project '+i,'','Pending','','']);return{success:true};}
function deleteStudent(r){const o=findStudent(r.internId);sheet(SHEET_NAME).deleteRow(o._row);const p=sheet(PROJECTS_SHEET);for(let i=p.getLastRow();i>=2;i--)if(p.getRange(i,1).getValue()===r.internId)p.deleteRow(i);return{success:true};}
function addProject(r){const o=findStudent(r.internId);const p=rowsToObjects(sheet(PROJECTS_SHEET)).filter(x=>x['Intern ID']===r.internId);sheet(PROJECTS_SHEET).appendRow([r.internId,o.Name,o.Email,p.length+1,r.title||('Project '+(p.length+1)),'','Pending','','']);sheet(SHEET_NAME).getRange(o._row,8).setValue(p.length+1);return{success:true};}
function submitProject(r){const p=rowsToObjects(sheet(PROJECTS_SHEET)).filter(x=>x['Intern ID']===r.internId);const item=p[Number(r.index)];if(!item)throw new Error('Project not found');sheet(PROJECTS_SHEET).getRange(item._row,2).setValue(findStudent(r.internId).Name);sheet(PROJECTS_SHEET).getRange(item._row,3).setValue(findStudent(r.internId).Email);sheet(PROJECTS_SHEET).getRange(item._row,6,1,3).setValues([[r.github,'Submitted',new Date()]]);return{success:true};}
function updateStatus(r){const o=findStudent(r.internId);sheet(SHEET_NAME).getRange(o._row,7).setValue(r.status);return{success:true};}
function confirmPayment(r){const o=findStudent(r.internId);sheet(SHEET_NAME).getRange(o._row,10).setValue('Confirmed');return generateOfferLetter(r);}
function approveProject(r){const p=rowsToObjects(sheet(PROJECTS_SHEET)).filter(x=>x['Intern ID']===r.internId);const item=p[Number(r.index)];if(!item)throw new Error('Project not found');sheet(PROJECTS_SHEET).getRange(item._row,7).setValue('Completed');sheet(PROJECTS_SHEET).getRange(item._row,9).setValue(new Date());const completed=rowsToObjects(sheet(PROJECTS_SHEET)).filter(x=>x['Intern ID']===r.internId&&x.Status==='Completed').length;const s=findStudent(r.internId);sheet(SHEET_NAME).getRange(s._row,9).setValue(completed);if(completed>=Number(s['Required Projects']))return generateCertificate(r);return{success:true,completed};}

function uploadDocument(r){
  const student=findStudent(r.internId);
  const type=String(r.documentType||'');
  if(type!=='offerLetter'&&type!=='certificate')throw new Error('Invalid document type');
  if(!r.base64)throw new Error('File data is missing');
  const cfg=settings();
  if(!cfg.OUTPUT_FOLDER_ID||String(cfg.OUTPUT_FOLDER_ID).startsWith('PASTE_'))throw new Error('OUTPUT_FOLDER_ID is not configured');
  const bytes=Utilities.base64Decode(r.base64);
  const safeName=String(r.fileName||type+'.pdf').replace(/[^a-zA-Z0-9._ -]/g,'_');
  const fileName=student['Intern ID']+' - '+(type==='offerLetter'?'Offer Letter':'Certificate')+' - '+safeName;
  const blob=Utilities.newBlob(bytes,r.mimeType||'application/pdf',fileName);
  const file=DriveApp.getFolderById(cfg.OUTPUT_FOLDER_ID).createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  const url='https://drive.google.com/uc?export=download&id='+file.getId();
  const column=type==='offerLetter'?11:12;
  sheet(SHEET_NAME).getRange(student._row,column).setValue(url);
  return{success:true,url};
}

function generateOfferLetter(r){const s=findStudent(r.internId);const cfg=settings();const url=createDocument(cfg.OFFER_TEMPLATE_ID,cfg.OUTPUT_FOLDER_ID,'Offer Letter - '+s.Name,{'{{NAME}}':s.Name,'{{INTERN_ID}}':s['Intern ID'],'{{DOMAIN}}':s.Domain,'{{DURATION}}':s.Duration,'{{DATE}}':Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd MMMM yyyy')});sheet(SHEET_NAME).getRange(s._row,11).setValue(url);sendDocumentEmail(s.Email,'ZeonX Solutions Internship Offer Letter','Your internship registration has been confirmed. Please find your offer letter here: '+url);return{success:true,url};}
function generateCertificate(r){const s=findStudent(r.internId);const cfg=settings();const url=createDocument(cfg.CERTIFICATE_TEMPLATE_ID,cfg.OUTPUT_FOLDER_ID,'Certificate - '+s.Name,{'{{NAME}}':s.Name,'{{INTERN_ID}}':s['Intern ID'],'{{DOMAIN}}':s.Domain,'{{DURATION}}':s.Duration,'{{DATE}}':Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd MMMM yyyy')});sheet(SHEET_NAME).getRange(s._row,12).setValue(url);sheet(SHEET_NAME).getRange(s._row,7).setValue('Completed');sendDocumentEmail(s.Email,'ZeonX Solutions Internship Certificate','Congratulations on completing your internship. Your certificate is available here: '+url);return{success:true,url};}
function createDocument(templateId,folderId,name,replacements){if(!templateId||String(templateId).startsWith('PASTE_'))throw new Error('Template ID is not configured');const copy=DriveApp.getFileById(templateId).makeCopy(name,DriveApp.getFolderById(folderId));const doc=DocumentApp.openById(copy.getId());const body=doc.getBody();Object.keys(replacements).forEach(k=>body.replaceText(k,replacements[k]));doc.saveAndClose();const pdf=DriveApp.getFolderById(folderId).createFile(copy.getAs(MimeType.PDF)).setName(name+'.pdf');pdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);return pdf.getUrl();}
function sendDocumentEmail(to,subject,body){if(to)MailApp.sendEmail({to,subject,body,name:'ZeonX Solutions'});}
