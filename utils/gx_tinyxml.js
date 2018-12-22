'use strict';

let GXTinyXml = {};

//////////////////////////////////////////////////
// HeaderFile
GXTinyXml.genHeaderFile = (tmplNamespace, content, includeDirectives) => `
#ifndef __${tmplNamespace}__HEADER__
#define __${tmplNamespace}__HEADER__

#include "ixmlread.h"
${includeDirectives}
namespace ${tmplNamespace} {
${content}
}

#endif
`;

GXTinyXml.genHeaderFileStruct = (elemStructName, content) => `
struct ${elemStructName}
{
    ${elemStructName}();

${content}
    void Load(TiXmlElement* node);
};
`;

GXTinyXml.genHeaderFileStructRoot = (content) => `
struct Config
{
    Config();

${content}
    void Load(TiXmlElement* node);
    void Parse(const char* content);
    void LoadFile(const char* filename);
};
`;

GXTinyXml.genHeaderFileStructVar = (type, variable) =>
`    ${type} ${variable};
`;

//////////////////////////////////////////////////
// SourceFile
GXTinyXml.genSourceFile = (fileBaseName, tmplNamespace, content) => `
#include "${fileBaseName}.h"

namespace ${tmplNamespace} {
${content}
}
`;

GXTinyXml.genSourceFileCtor = (elemStructName, content) => `
${elemStructName}::${elemStructName}()
${content}{}
`;

GXTinyXml.genSourceFileCtorVar = (variable, defaultValue, isFirst) => 
`    ${isFirst ? ':' : ','} ${variable}(${typeof defaultValue==='string' ? '\"'+defaultValue+'\"':defaultValue})
`;

GXTinyXml.genSourceFileLoad = (elemStructName, content) => `
void ${elemStructName}::Load(TiXmlElement* node)
{
${content}}
`;

GXTinyXml.genSourceFileLoadVar = (variable) =>
`    ::Read(node, "${variable}", ${variable});
`;

GXTinyXml.genSourceFileParse = (elemName) => `
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

GXTinyXml.genSourceFileLoadFile = (elemName) => `
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

module.exports = GXTinyXml;
