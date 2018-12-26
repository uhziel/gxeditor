#include "tinyxml_template/fruits.h"

#include <iostream>
int main()
{
	GXFruits::Config config;
	config.LoadFile("fruits.xml");

	GXFruits::Config b_config;
	FILE* file = fopen("fruits.xml", "r");
	char buf[1024] = {0};
	fread(buf, 1, 1024, file);
	b_config.Parse(buf);
	fclose(file);

	std::cout << "read config" << std::endl;
    return 0;
}
