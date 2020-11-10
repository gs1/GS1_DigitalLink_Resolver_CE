// This is the base class for any custom error in application.
// Every custom error class must extends this class.
class CustomErrorBaseClass extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

module.exports = CustomErrorBaseClass;
