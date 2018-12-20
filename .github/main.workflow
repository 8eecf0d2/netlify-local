workflow "Install and Test" {
  on = "push"
  resolves = ["Publish"]
}

action "Install" {
  uses = "borales/actions-yarn@master"
  args = "install"
}

action "Test" {
  needs = "Install"
  uses = "borales/actions-yarn@master"
  args = "test"
}

action "Master" {
  needs = "Test"
  uses = "actions/bin/filter@master"
  args = "tag *.*.*"
}

action "Publish" {
 needs = "Master"
 uses = "borales/actions-yarn@master"
 args = "publish --access public"
 secrets = ["NPM_AUTH_TOKEN"]
}
