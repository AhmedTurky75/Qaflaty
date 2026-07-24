import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreConfigurationDto } from 'shared';

@Component({
  selector: 'app-layout-design-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './layout-design-panel.component.html',
  styleUrl: './layout-design-panel.component.scss'
})
export class LayoutDesignPanelComponent implements OnInit {
  @Input() config!: StoreConfigurationDto;
  @Output() configChange = new EventEmitter<StoreConfigurationDto>();

  localConfig!: StoreConfigurationDto;

  ngOnInit(): void {
    this.localConfig = JSON.parse(JSON.stringify(this.config));
  }

  onConfigChange(): void {
    this.configChange.emit(this.localConfig);
  }
}
