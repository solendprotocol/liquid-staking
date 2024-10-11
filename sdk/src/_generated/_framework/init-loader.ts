import * as package_source_1 from "../_dependencies/source/0x1/init";
import * as package_source_2 from "../_dependencies/source/0x2/init";
import * as package_source_3 from "../_dependencies/source/0x3/init";
import * as package_source_0 from "../liquid_staking/init";
import { StructClassLoader } from "./loader";

function registerClassesSource(loader: StructClassLoader) {
  package_source_0.registerClasses(loader);
  package_source_1.registerClasses(loader);
  package_source_2.registerClasses(loader);
  package_source_3.registerClasses(loader);
}

export function registerClasses(loader: StructClassLoader) {
  registerClassesSource(loader);
}
