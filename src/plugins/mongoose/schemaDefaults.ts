function schemaDefaults(schema: any) {
  //Default schema options
  //Extend options
  schema.options = Object.assign(schema.options || {}, {
    // ! not working. please set timestamps on every schema.
    // timestamps: true,
  });
}

export default schemaDefaults;
