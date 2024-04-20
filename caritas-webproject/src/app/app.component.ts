import {Component, ElementRef, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective  } from 'ng2-charts';
import {Chart, ChartConfiguration, ChartOptions, ChartType} from "chart.js";
import {MatTab, MatTabGroup} from "@angular/material/tabs";
import {MatToolbar} from "@angular/material/toolbar";

// Define custom primary and accent colors

// Include the custom th

@Component({

  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, MatTabGroup, MatTab, MatToolbar],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'caritas-webproject';

  records: any[] = [];
  chart: any;

  createChart(){

    this.chart = new Chart("MyChart", {
      type: 'line', //this denotes tha type of chart

      data: {// values on X-Axis
        labels: [],
        datasets: [

        ]
      },
      options: {
        aspectRatio:2.5
      }

    });
  }


  ngOnInit() {
    this.initialize()

  }

  async initialize(): Promise<void> {
    // Fill the array asynchronously
    await this.loadCSVData();



    const dateCountMap = this.countPerYear();

    this.createChart();


    let iterator = dateCountMap.entries();
    let result = iterator.next();


    while (!result.done) {
      let [date, count] = result.value;

       this.chart.data.labels.push(date);

      //TODO error point x-axis. all points on x=0
      this.chart.data.datasets.push({
        data: [count], // Assuming you want to plot count as the value
        label: date, // You can use date as label
        borderColor: 'rgb(75, 192, 192)',
        fill: false,
      });
      result = iterator.next();
    }

    this.chart.update()

  }

  async loadCSVData() {
    try {
      const response = await fetch('assets/Falldaten_CaritasbB.csv');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.text();
      this.parseCSV(data);
    } catch (error) {
      console.error('Could not load or parse the CSV:', error);
    }
  }

  parseCSV(data: string) {
    const rows = data.split('\n');
    const headersRow = rows.shift();
    if (!headersRow) {
      console.error('CSV is empty or does not contain headers');
      return; // Exit if no headers
    }
    const headers = headersRow.split(';').map(header => header.trim().replaceAll('"', '').replaceAll("'", ""));

    //console.log("removing")

    this.records = rows.map(row => {
      const columns = row.split(';').map(column => column.trim().replaceAll('"', '').replaceAll("'", ""));
      if (columns.length < headers.length) {
        console.error('Row has fewer columns than headers');
        return null; // Return null for rows with insufficient data
      }
      let record: {[key: string]: string} = {}; // Explicitly define the record type
      headers.forEach((header, index) => {
        record[header] = columns[index];
      });
      return record;
    }).filter(record => record); // Filter out null entries




    //Calling rendering graphs
    this.countPerDay();

  }

  countPerDay(){
    const dateCountMap = new Map(); // Map to store date-count pairs
    // Loop through CSV array
    this.records.forEach(entry => {
      const date = entry["Datum_Leistung"];

      // If date exists in the map, increment count, otherwise set count to 1
      if (dateCountMap.has(date)) {
        dateCountMap.set(date, dateCountMap.get(date) + 1);
      } else {
        dateCountMap.set(date, 1);
      }
    });

    // Return the map containing date-count pairs
    return dateCountMap;
  }

  countPerYear(){
    const yearCountMap = new Map(); // Map to store year-count pairs
    // Loop through CSV array
    this.records.forEach(entry => {
      const date = entry["Datum_Leistung"];
      const year = date.split("-")[0]; // Extract year from date

      // If year exists in the map, increment count, otherwise set count to 1
      if (yearCountMap.has(year)) {
        yearCountMap.set(year, yearCountMap.get(year) + 1);
      } else {
        yearCountMap.set(year, 1);
      }
    });

    // Return the map containing year-count pairs
    return yearCountMap;
  }


  // Function to calculate the average per weekday
  //TODO: FIX ENDRIT
calculateAveragePerWeekday() {
  const weekdayCountMap = new Map(); // Map to store weekday-count pairs
  const weekdayTotalMap = new Map(); // Map to store weekday-total pairs

  // Loop through CSV array
  this.records.forEach(entry => {
    const date = new Date(entry["Datum_Leistung"]);
    const weekday = date.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday

    // If weekday exists in the count map, increment count and add value to total
    if (weekdayCountMap.has(weekday)) {
      weekdayCountMap.set(weekday, weekdayCountMap.get(weekday) + 1);
      weekdayTotalMap.set(weekday, weekdayTotalMap.get(weekday) + entry.value);
    } else {
      weekdayCountMap.set(weekday, 1);
      weekdayTotalMap.set(weekday, entry.value);
    }
  });
  const averages = new Map();

  // Calculate average for each weekday
  for (let i = 0; i < 7; i++) {
    if (weekdayCountMap.has(i)) {
      const weekdayAverage = weekdayTotalMap.get(i) / weekdayCountMap.get(i);
      averages.set(i, weekdayAverage);
    }
  }
  // Return map containing weekday-average pairs
  return averages;
}

}
