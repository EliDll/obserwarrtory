import {AfterViewInit, Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {NestedTreeControl} from "@angular/cdk/tree";
import {MatTreeNestedDataSource} from "@angular/material/tree";
import {Node} from "../Specfiles/Node";


@Component({
  selector: 'app-tree-navigation',
  templateUrl: './treeNavigation.component.html',
  styleUrls: ['./treeNavigation.component.css']
})
export class TreeNavigationComponent implements OnInit, OnDestroy {
  // global reference, shan't be modified
  @Input() treeTemplate: Array<any>;
  @Input() cachedTree: Node[];
  // local working copy, adds control attributes to template
  actualTree: Array<any>;
  @Output() treeChange: EventEmitter<Node> = new EventEmitter<Node>();
  @Output() treeDestroy: EventEmitter<Node[]> = new EventEmitter<Node[]>();

  treeControl: NestedTreeControl<Node> = new NestedTreeControl<Node>(node => node.children);
  dataSource: MatTreeNestedDataSource<Node> = new MatTreeNestedDataSource<Node>();


  constructor() {
    this.actualTree = [];
  }

  addToggleState(template) {
    for (const templateNode of template) {
      template["checked"] = false;
      if (template["children"]) {
        template["children"].forEach(child => this.addToggleState(child));
      }
    }
  }

  deepCopy(treeTemplateNode: any) {
    // make shallow copy for attributes of current node
    const actualTreeNode = Object.assign({}, treeTemplateNode);
    // add attribute for view
    actualTreeNode["checked"] = false;
    // if not leaf node recursive copy of children
    if (treeTemplateNode["children"]) {
      actualTreeNode["children"] = [];
      for (const child of treeTemplateNode["children"]) {
        actualTreeNode["children"].push(this.deepCopy(child));
      }
    }
    return actualTreeNode;
  }

  // defined for html display
  hasChild = (_: number, node: Node) => !!node.children && node.children.length > 0;

  ngOnInit(): void {
    if (this.cachedTree === null) {
      // no cached tree, initialize from scratch
      // recursive deep copy of each tree root in template array
      for (const rootNode of this.treeTemplate) {
        this.actualTree.push(this.deepCopy(rootNode));
      }
      // unsafe assignment, but satisfies Node interface now
      // @ts-ignore
      this.dataSource.data = this.actualTree;
    } else {
      // take existing tree provided by parent
      this.dataSource.data = this.cachedTree;
    }
  }

  ngOnDestroy() {
    // return last tree state to parent on destruction
    this.treeDestroy.emit(this.dataSource.data);
  }


  // top level call from directly toggled node, sift down recursively
  toggleNode(isChecked, node: Node) {
    if (node.children) {
      // update state & view
      node.checked = isChecked;
      // is not leaf, call for each children
      node.children.forEach(child => this.toggleNode(isChecked, child));
    } else if (node.checked !== isChecked) {
      // update state & view
      node.checked = isChecked;
      // notify parent container of change in leaf component
      this.treeChange.emit(node);
    }
  }

  getFlattenedLeafs(children: Node[], acc: Node[]) {
    for (const node of children) {
      if (node.children) {
        this.getFlattenedLeafs(node.children, acc);
      } else {
        acc.push(node);
      }
    }
  }


}
