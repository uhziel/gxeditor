'use strict';

let GXCodeScheme = {};

//////////////////////////////////////////////////
// HeaderFile
GXCodeScheme.genHeaderFile = (fileBaseName, tmplNamespace, content, includeDirectives) =>
`#ifndef __${fileBaseName}__GXHEADER__
#define __${fileBaseName}__GXHEADER__

#include "gx_utils.h"
${includeDirectives}
namespace ${tmplNamespace} {
${content}
}

#endif
`;

GXCodeScheme.genHeaderFileStruct = (elemStructName, content) => `
struct ${elemStructName}
{
    ${elemStructName}();

${content}
    void Load(TiXmlElement* node);
};
`;

GXCodeScheme.genHeaderFileStructRoot = (content) => `
struct Config
{
    Config();

${content}
    void Load(TiXmlElement* node);
    void Parse(const char* content);
    void LoadFile(const char* filename);
};
`;

GXCodeScheme.genHeaderFileStructVar = (type, variable) =>
`    ${type} ${variable};
`;

//////////////////////////////////////////////////
// SourceFile
GXCodeScheme.genSourceFile = (fileBaseName, tmplNamespace, content) =>
`#include "${fileBaseName}.h"

namespace ${tmplNamespace} {
${content}
}
`;

GXCodeScheme.genSourceFileCtor = (elemStructName, content) => `
${elemStructName}::${elemStructName}()
${content}{}
`;

GXCodeScheme.genSourceFileCtorVar = (variable, defaultValue, isFirst) => 
`    ${isFirst ? ':' : ','} ${variable}(${typeof defaultValue==='string' ? '\"'+defaultValue+'\"':defaultValue})
`;

GXCodeScheme.genSourceFileLoad = (elemStructName, content) => `
void ${elemStructName}::Load(TiXmlElement* node)
{
${content}}
`;

GXCodeScheme.genSourceFileLoadVar = (variable) =>
`    ::Read(node, "${variable}", ${variable});
`;

GXCodeScheme.genSourceFileParse = (elemName) => `
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

GXCodeScheme.genSourceFileLoadFile = (elemName) => `
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

module.exports = GXCodeScheme;
