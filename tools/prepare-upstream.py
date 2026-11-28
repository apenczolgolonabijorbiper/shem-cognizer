"""Prepare exact published acceptance packages; never touch consumer runtimes."""
import argparse, hashlib, io, json, pathlib, shutil, urllib.request, zipfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
def sha(data): return hashlib.sha256(data).hexdigest()
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'shem-qualification'}), timeout=60) as r:
        data=r.read(32*1024*1024+1)
    if len(data)>32*1024*1024: raise ValueError('Archive budget exceeded')
    return data

def prepare(destination):
    pins=json.loads((ROOT/'compatibility.json').read_text())
    destination=pathlib.Path(destination).resolve()
    if destination.exists() and any(destination.iterdir()): raise ValueError('Destination must be empty')
    for project,key,folder,archive in [('chelm-host','chelm','chelm-host','chelm-host-1.4.0.zip'),('golem14-harness','harness','golem-harness','golem-cognitive-harness-0.14.0.zip')]:
        pin=pins[key];base=f'https://github.com/apenczolgolonabijorbiper/{project}/releases/download/v{pin["version"]}/{archive}'
        payload=get(base)
        if sha(payload)!=pin['archive_sha256']: raise ValueError('Archive identity differs')
        checksum=get(base+'.sha256').decode().split()
        if checksum!=[pin['archive_sha256'],archive]: raise ValueError('Published checksum differs')
        package=zipfile.ZipFile(io.BytesIO(payload));items=package.infolist()
        if len(items)>2000 or sum(x.file_size for x in items)>64*1024*1024: raise ValueError('Extraction budget exceeded')
        manifest_bytes=package.read(folder+'/RELEASE.json')
        if sha(manifest_bytes)!=pin['manifest_sha256']: raise ValueError('Manifest identity differs')
        manifest=json.loads(manifest_bytes)
        expected={folder+'/'+p for p in manifest['files']}|{folder+'/RELEASE.json'}
        if len(items)!=len(expected) or set(package.namelist())!=expected: raise ValueError('Inventory differs')
        for item in items:
            p=pathlib.PurePosixPath(item.filename)
            if p.parts[0]!=folder or any(v in {'.','..'} for v in p.parts) or '\\' in item.filename or ':' in item.filename or item.is_dir() or (item.external_attr>>16)&0o170000 not in {0,0o100000}: raise ValueError('Unsafe member')
            data=package.read(item)
            if item.filename!=folder+'/RELEASE.json' and sha(data)!=manifest['files'][str(p.relative_to(folder))]: raise ValueError('File integrity differs')
        for item in items:
            output=destination/item.filename;output.parent.mkdir(parents=True,exist_ok=True);output.write_bytes(package.read(item))
    print(json.dumps({'chelm':str(destination/'chelm-host'),'harness':str(destination/'golem-harness'),'verified':True}))
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--destination',required=True);prepare(parser.parse_args().destination)
