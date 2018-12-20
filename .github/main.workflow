workflow "Install and Test" {
  on = "push"
  resolves = ["Test"]
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

# action "Publish" {
#  needs = "Test"
#  uses = "borales/actions-yarn@master"
#  args = "publish --access public"
#  secrets = ["NPM_AUTH_TOKEN"]
# }
