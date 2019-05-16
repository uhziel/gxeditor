'use strict';

let cppTmpl = {};
  
//////////////////////////////////////////////////
// HeaderFile
cppTmpl.genHeaderFile = (fileBaseName, tmplNamespace, content, includeDirectives) =>
`#ifndef __${fileBaseName}__GXHEADER__
#define __${fileBaseName}__GXHEADER__

#include "gx_utils.h"
${includeDirectives}
namespace ${tmplNamespace} {
${content}
}

#endif
`;

cppTmpl.genHeaderFileStruct = (elemStructName, content) => `
struct ${elemStructName}
{
    ${elemStructName}();

${content}
    void Load(TiXmlElement* node);
};
`;

cppTmpl.genHeaderFileStructRoot = (content) => `
struct Config
{
    Config();

${content}
    void Load(TiXmlElement* node);
    void Parse(const char* content);
    void LoadFile(const char* filename);
};
`;

cppTmpl.genHeaderFileStructVar = (type, variable) =>
`    ${type} ${variable};
`;

//////////////////////////////////////////////////
// SourceFile
cppTmpl.genSourceFile = (fileBaseName, tmplNamespace, content) =>
`#include "${fileBaseName}.config.h"

namespace ${tmplNamespace} {
${content}
}
`;

cppTmpl.genSourceFileCtor = (elemStructName, content) => `
${elemStructName}::${elemStructName}()
${content}{}
`;

cppTmpl.genSourceFileCtorVar = (variable, attr, isFirst) => {
	const defaultValue = attr.default;
	return `    ${isFirst ? ':' : ','} ${variable}(${typeof defaultValue==='string' ? '\"'+defaultValue+'\"':defaultValue})
`
};

cppTmpl.genSourceFileLoad = (elemStructName, content) => `
void ${elemStructName}::Load(TiXmlElement* node)
{
${content}}
`;

cppTmpl.genSourceFileLoadVar = (variable) =>
`    ::Read(node, "${variable}", ${variable});
`;

cppTmpl.genSourceFileParse = (elemName) => `
void Config::Parse(const char* content)
{
    if (NULL == content)
    {
        return;
    }

	TiXmlDocument doc;
	doc.Parse(content);
    if (doc.Error())
	{
		return;
	}

 	TiXmlElement* root = doc.FirstChildElement("${elemName}");
	if (NULL == root)
	{
		return;
	}

	*this = Config();
    Load(root);
}
`;

cppTmpl.genSourceFileLoadFile = (elemName) => `
void Config::LoadFile(const char* filename)
{
    if (NULL == filename)
    {
        return;
    }

	TiXmlDocument doc(filename);
    if (!doc.LoadFile())
	{
		return;
	}

 	TiXmlElement* root = doc.FirstChildElement("${elemName}");
	if (NULL == root)
	{
		return;
	}

	*this = Config();
    Load(root);
}
`;

module.exports = cppTmpl;
