const response = await fetch("static/test.html");

const rawTemplate = await response.text();

console.log(rawTemplate);

const parser = new DOMParser();

const parsedTemplate = parser.parseFromString(rawTemplate, "text/html");

console.log(parsedTemplate);

const clone = parsedTemplate
  .getElementById("template1")
  .content.cloneNode(true);

console.log(clone);

const adopedNode = document.adoptNode(clone);

console.log(adopedNode);

document.body.prepend(adopedNode);
