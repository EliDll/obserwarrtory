// Interface that defines a Tree as a composite
export interface Node {
  id: string;
  checked: boolean;
  children?: Node[];
}
