workflow "Install and Test" {
  on = "push"
  resolves = ["Publish"]
}

action "Install" {
  uses = "borales/actions-yarn@master"
  args = "install"
}

action "Test" {
  needs = ["Install"]
  uses = "borales/actions-yarn@master"
  args = "test"
}

action "Release Tag" {
  needs = ["Test"]
  uses = "actions/bin/filter@master"
  args = "tag *.*.*"
}

action "Publish" {
 needs = ["Release Tag"]
 uses = "borales/actions-yarn@master"
 args = "publish --access public"
 secrets = ["NPM_AUTH_TOKEN"]
}
