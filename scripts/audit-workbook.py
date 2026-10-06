"""Read-only OOXML inventory. Never upload its output to a public repository.
Usage: python3 scripts/audit-workbook.py input.xlsx /private/output.json
No macros or formulas are executed. Shared-formula anchors are retained.
"""
import collections
import hashlib
import json
import pathlib
import posixpath
import sys
import xml.etree.ElementTree as ET
import zipfile

source, destination = map(pathlib.Path, sys.argv[1:3])
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(source) as archive:
    root = ET.fromstring(archive.read('xl/workbook.xml'))
    relationships = {r.attrib['Id']: r.attrib['Target'] for r in
                     ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
    strings = [''.join(s.itertext()) for s in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
    result = {'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'sheets': [], 'names': []}
    for sheet in root.find('m:sheets', ns):
        target = relationships[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
        path = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/' + target)
        tree = ET.fromstring(archive.read(path))
        entry = {'name': sheet.attrib['name'], 'state': sheet.attrib.get('state', 'visible'),
                 'formulas': [], 'cells': [], 'validations': [], 'tables': []}
        for cell in tree.findall('m:sheetData/m:row/m:c', ns):
            value = cell.findtext('m:v', '', ns)
            if cell.attrib.get('t') == 's' and value:
                value = strings[int(value)]
            formula = cell.find('m:f', ns)
            if formula is not None:
                entry['formulas'].append({'cell': cell.attrib['r'], 'formula': formula.text,
                                          'attributes': formula.attrib, 'cached': value})
            elif value:
                entry['cells'].append({'cell': cell.attrib['r'], 'value': value, 'type': cell.attrib.get('t')})
        for validation in tree.findall('m:dataValidations/m:dataValidation', ns):
            entry['validations'].append({'attributes': validation.attrib, 'rules': list(validation.itertext())})
        result['sheets'].append(entry)
    result['names'] = [{'attributes': n.attrib, 'value': n.text} for n in root.findall('m:definedNames/m:definedName', ns)]
    result['tables'] = [ET.tostring(ET.fromstring(archive.read(n)), encoding='unicode')
                        for n in archive.namelist() if n.startswith('xl/tables/') and n.endswith('.xml')]
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps({'sheets': len(result['sheets']), 'formulaCells': sum(len(s['formulas']) for s in result['sheets']),
                  'names': len(result['names']), 'tables': len(result['tables'])}))
