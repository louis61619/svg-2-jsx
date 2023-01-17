
const parser = require('svg-parser');
const path = require('path');
const fs = require('fs');
const babel = require('@babel/core');
const clean = require('./clean');
const transform = require('./transformer');
const stringify = require('./stringer');
const format = require('./formater');

const dist = path.resolve(__dirname, '../../dist');


async function transformer(svg, config = {
}) {
  const cleaned = await clean(svg, config);
  const parsed = parser.parse(cleaned.data);
  // console.log(parsed, '---parsed')
  const transformed = transform(parsed);

  const morphed = stringify(transformed);
  // console.log(morphed, '---morphed')
  const formatted = format(morphed, config);
  // console.log(formatted, '---formatted')
  const { code } = babel.transformSync(formatted, {
    plugins: ["@babel/plugin-transform-react-jsx"],
  });
  return code;
}

const files = fs.readdirSync(path.resolve(__dirname, '../svg'));

function getCamelCase(str) {
  const re = /-(\w)/g;
  const s = str.replace(/\.svg$/, '').replace(re, function ($0, $1) {
    return $1.toUpperCase();
  });
  return s.replace(/^./, s[0].toUpperCase());
}

let allFiles = [];

if (!fs.existsSync(dist)){
  fs.mkdirSync(dist);
} else {
  fs.readdirSync(dist).forEach(f => fs.rmSync(`${dist}/${f}`));
}

files.forEach((file) => {
  const newFileName = getCamelCase(file);
  allFiles.push(newFileName);
  const svgStr = fs.readFileSync(path.resolve(__dirname, `../svg/${file}`)).toString();
  // console.log(newFileName)
  transformer(svgStr, {
    filename: newFileName
  }).then(res => {
    fs.writeFileSync(path.resolve(__dirname, `../../dist/${newFileName}.js`), res);
	fs.writeFileSync(path.resolve(__dirname, `../../dist/${newFileName}.d.ts`), `import React from "react";

export default ${newFileName};
declare function ${newFileName}(props: React.SVGAttributes<SVGElement>): JSX.Element;
	`);
  });
});

const l = allFiles.reduce((pre, cur) => {
  return pre + `export { default as ${cur} } from './${cur}';\n`;
}, '');

// console.log(l)

fs.writeFileSync(path.resolve(__dirname, '../../dist/index.js'), l);
fs.writeFileSync(path.resolve(__dirname, '../../dist/index.d.ts'), l);

// transformer(a).then(res => {
//   console.log(res)
//   const a = babel.transformSync(res, {
//     plugins: ["@babel/plugin-transform-react-jsx"],
//   });
//   console.log(a.code)
//   // const f = require("@babel/core").transform(a, {
//   //   plugins: ["@babel/plugin-transform-react-jsx"],
//   // });
//   // console.log(f)

//   // fs.writeFileSync('aaa.js', f)
// })
