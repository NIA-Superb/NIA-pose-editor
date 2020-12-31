import axios, { AxiosInstance } from 'axios'
import { JSONDataset } from './convertDatasetFormat'
import { CamParams } from './predict3dPoints'

export class Api {
  private axios: AxiosInstance
  constructor() {
    this.axios = axios.create({
      baseURL:"/api/v1/"
    })
  }

  public async loadDataset(): Promise<JSONDataset> {
    const resp = await this.axios.get('dataset/annotations')
    return resp.data as JSONDataset
  }

  public async saveDataset(s:JSONDataset):Promise<boolean> {
    const resp = await this.axios.post('dataset/annotations', s)
    return resp.data as boolean
  }

  public async camParams(): Promise<{[key:string]:CamParams}> {
    const resp = await this.axios.get('dataset/cam_params')
    return resp.data as {[key:string]:CamParams}
  }

  public async boneConnections(): Promise<[string,string][]> {
    return [
      ["p00", "p04"],
      ["p00", "p01"],
      ["p01", "p02"],
      ["p03", "p02"],
      ["p04", "p05"],
      ["p05", "p06"],
      ["p07", "p08"],
      ["p07", "p00"],
      ["p09", "p08"],
      ["p10", "p09"],
      ["p11", "p08"],
      ["p12", "p11"],
      ["p13", "p12"],
      ["p14", "p08"],
      ["p15", "p14"],
      ["p15", "p16"]
    ]
  }

  public async imageRoot(): Promise<string> {
    return '/api/v1/images/'
  }
}
