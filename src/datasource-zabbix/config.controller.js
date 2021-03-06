import _ from 'lodash';
import { migrateDSConfig } from './migrations';

const SUPPORTED_SQL_DS = ['mysql', 'postgres', 'influxdb'];

const zabbixVersions = [
  { name: '2.x', value: 2 },
  { name: '3.x', value: 3 },
  { name: '4.x', value: 4 },
];

const defaultConfig = {
  trends: false,
  dbConnectionEnable: false,
  dbConnectionDatasourceId: null,
  alerting: false,
  addThresholds: false,
  alertingMinSeverity: 3,
  disableReadOnlyUsersAck: false,
  zabbixVersion: 3,
};

export class ZabbixDSConfigController {

  /** @ngInject */
  constructor($scope, $injector, datasourceSrv) {
    this.datasourceSrv = datasourceSrv;

    this.current.jsonData = migrateDSConfig(this.current.jsonData);
    _.defaults(this.current.jsonData, defaultConfig);
    this.dbDataSources = this.getSupportedDBDataSources();
    this.zabbixVersions = _.cloneDeep(zabbixVersions);
    this.autoDetectZabbixVersion();
  }

  getSupportedDBDataSources() {
    let datasources = this.datasourceSrv.getAll();
    return _.filter(datasources, ds => {
      return _.includes(SUPPORTED_SQL_DS, ds.type);
    });
  }

  getCurrentDatasourceType() {
    const dsId = this.current.jsonData.dbConnectionDatasourceId;
    const currentDs = _.find(this.dbDataSources, { 'id': dsId });
    return currentDs ? currentDs.type : null;
  }

  autoDetectZabbixVersion() {
    if (!this.current.id) {
      return;
    }

    this.datasourceSrv.loadDatasource(this.current.name)
    .then(ds => {
      return ds.getVersion();
    })
    .then(version => {
      if (version) {
        if (!_.find(zabbixVersions, ['value', version])) {
          this.zabbixVersions.push({ name: version + '.x', value: version });
        }
        this.current.jsonData.zabbixVersion = version;
      }
    });
  }
}
