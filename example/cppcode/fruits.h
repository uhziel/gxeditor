#ifndef __GXFruits__HEADER__
#define __GXFruits__HEADER__

#include "ixmlread.h"
#include "fruit.h"

namespace GXFruits {

struct Config
{
    Config();

    std::vector<GXShare::Fruit> fruit;

    void Load(TiXmlElement* node);
    void Parse(const char* content);
    void LoadFile(const char* filename);
};

}

#endif
