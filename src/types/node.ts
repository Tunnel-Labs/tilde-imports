export interface Node extends Record<keyof any, Node> {
	'\0'?: any;
}
