
#include "fruits.h"

namespace GXFruits {

Config::Config()
{}

void Config::Load(TiXmlElement* node)
{
    ::Read(node, "fruit", fruit);
}

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

 	TiXmlElement* root = doc.FirstChildElement("fruits");
	if (NULL == root)
	{
		return;
	}

	*this = Config();
    Load(root);
}

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

 	TiXmlElement* root = doc.FirstChildElement("fruits");
	if (NULL == root)
	{
		return;
	}

	*this = Config();
    Load(root);
}

}
