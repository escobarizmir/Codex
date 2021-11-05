module.exports = {
	entry: "./src/renderer.ts",
	output: {
		filename: "renderer.js",
		libraryTarget: "var",
		library: "renderer"
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	mode: "production",
	devtool: "source-map"
};