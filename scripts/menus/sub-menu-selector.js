H5PEditor.ImpressPresentationEditor = H5PEditor.ImpressPresentationEditor || {};

H5PEditor.ImpressPresentationEditor.SubMenuSelector = (function ($, JoubelUI) {

  function SubMenuSelector(IPEditor) {

    var $subMenuSelector = $('<div>', {
      'class': 'h5p-right-aligned-submenu'
    });

    var currentSubMenu = IPEditor.coreMenu;

    var setActiveSubMenu = function (subMenu) {
      currentSubMenu.hide();
      currentSubMenu = subMenu;
    };

    IPEditor.coreMenu.createButton(function () {
      setActiveSubMenu(IPEditor.coreMenu)
    }).appendTo($subMenuSelector);

    IPEditor.transformMenu.createButton(function () {
      setActiveSubMenu(IPEditor.transformMenu)
    }).appendTo($subMenuSelector);

    IPEditor.orderingMenu.createButton(function () {
      setActiveSubMenu(IPEditor.orderingMenu)
    }).appendTo($subMenuSelector);

    var backgroundTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'background', {});
    JoubelUI.createButton({
      'class': 'h5p-main-menu-button h5p-background-menu-button',
      'title': backgroundTitle
    }).click(function () {
      IPEditor.editStepBackground();
    }).appendTo($subMenuSelector);

    var editTitle = H5PEditor.t('H5PEditor.ImpressPresentationEditor', 'edit', {});
    JoubelUI.createButton({
      'class': 'h5p-main-menu-button h5p-edit-content-menu-button',
      'title': editTitle
    }).click(function () {
      IPEditor.editStepContent();
    }).appendTo($subMenuSelector);

    this.appendTo = function ($wrapper) {
      $subMenuSelector.appendTo($wrapper);
    }
  }

  return SubMenuSelector;
})(H5P.jQuery, H5P.JoubelUI);
