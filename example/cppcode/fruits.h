#ifndef __fruits__GXHEADER__
#define __fruits__GXHEADER__

#include "gx_utils.h"
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
