import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

export async function buildSiteAssets(esbuildPath) {
  const esbuild=esbuildPath?await import(pathToFileURL(resolve(esbuildPath))):await import('esbuild');
  const root=new URL('../',import.meta.url);
  const [base,portal,result]=await Promise.all([
    readFile(new URL('samples/ink-resume/style.css',root),'utf8'),
    readFile(new URL('samples/ink-resume-portal/style.css',root),'utf8'),
    esbuild.build({entryPoints:[fileURLToPath(new URL('samples/ink-resume-portal/app.mjs',root))],
      bundle:true,format:'esm',target:'es2022',minify:true,write:false,legalComments:'inline'}),
  ]);
  await mkdir(new URL('assets/js/',root),{recursive:true});
  await mkdir(new URL('assets/css/',root),{recursive:true});
  await writeFile(new URL('assets/js/ink-resume.js',root),result.outputFiles[0].text);
  await writeFile(new URL('assets/css/ink-resume.css',root),`${base}\n${portal}`);
  return {js:result.outputFiles[0].contents.length,css:Buffer.byteLength(`${base}\n${portal}`)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await buildSiteAssets(process.argv[2])));
