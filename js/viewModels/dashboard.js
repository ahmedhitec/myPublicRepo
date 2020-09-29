/**
 * @license
 * Copyright (c) 2014, 2020, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
/*
 * Your dashboard ViewModel code goes here
 */
define(['accUtils','knockout', 'ojs/ojbootstrap', 'ojs/ojarraydataprovider',
'ojs/ojknockout-keyset', 'ojs/ojknockout', 'ojs/ojselector',
'ojs/ojlistitemlayout', 'ojs/ojavatar', 'ojs/ojlistview'],
 function(accUtils,ko, Bootstrap, ArrayDataProvider, keySet) {
    function DashboardViewModel() {


      let self = this;


      self.ordsURL = "https://ZJ8QY1RLCNIZHKF-ADB.adb.me-jeddah-1.oraclecloudapps.com/ords/madcap/nav/tree/0";
      

      self.dataProvider = ko.observableArray();
      self.listItems = ko.observableArray();
      
      $.ajax({
            url: self.ordsURL,
            dataType: 'json',
            async: false,
            data: {},
            success: function(myData) {
            self.listItems(myData);
            self.dataProvider = new ArrayDataProvider(self.listItems, {keyAttributes: 'N_OBJECT_ID'});          
            }
          });

      this.selectedActivityChanged= function(event)
      {

        if (event.detail.value.length != 0) {
          // If selection, populate and display list
          self.ordsURL = "https://ZJ8QY1RLCNIZHKF-ADB.adb.me-jeddah-1.oraclecloudapps.com/ords/madcap/nav/tree/"+event.detail.value[0];
          $.ajax({
            url: self.ordsURL,
            dataType: 'json',
            async: false,
            data: {},
            success: function(myData) {
            self.listItems(myData);
            self.dataProvider = new ArrayDataProvider(self.listItems, {keyAttributes: 'N_OBJECT_ID'});          
            }
          });
          console.log(event.detail.value[0]);
        } else {
          // If deselection, hide list
        }
      };













      this.connected = () => {
        accUtils.announce('Dashboard page loaded.', 'assertive');
        document.title = "Dashboard";
        // Implement further logic if needed
      };

      /**
       * Optional ViewModel method invoked after the View is disconnected from the DOM.
       */
      this.disconnected = () => {
        // Implement if needed
      };

      /**
       * Optional ViewModel method invoked after transition to the new View is complete.
       * That includes any possible animation between the old and the new View.
       */
      this.transitionCompleted = () => {
        // Implement if needed
      };
    }

    /*
     * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
     * return a constructor for the ViewModel so that the ViewModel is constructed
     * each time the view is displayed.
     */
    return DashboardViewModel;
  }
);
