import { XMLParser } from "fast-xml-parser";
import fetch from "node-fetch";
import { useQuery } from "../nextcloud";
import { getPreferences } from "../preferences";

export function useActivity() {
  const { data, isLoading } = useQuery((signal) => performGetActivity(signal));

  return {
    activity: data ?? [],
    isLoading,
  };
}

export async function performGetActivity(signal: AbortSignal): Promise<Activity[]> {
  const res = await ocsRequest({
    signal,
    base: `apps/activity/api/v2/activity?limit=200`,
  });

  const activities = res.element.map((element) => {
    return {
      activityId: element.activity_id,
      app: element.app,
      type: element.type,
      user: element.user,
      subject: element.subject,
      objectType: element.object_type,
      objectName: element.object_name,
      objects: element.objects,
      link: element.link,
      icon: element.icon,
      datetime: element.datetime,
    } as Activity;
  });
  return activities;
}

async function ocsRequest({
  signal,
  base = "",
  body,
  method = "GET",
}: {
  signal: AbortSignal;
  body?: string;
  base?: string;
  method?: string;
}) {
  const { hostname, username, password } = getPreferences();

  const response = await fetch(`https://${hostname}/ocs/v2.php/${base}`, {
    method,
    headers: {
      "OCS-APIRequest": "true",
      authorization: "Basic " + Buffer.from(username + ":" + password).toString("base64"),
    },
    body,
    signal,
  });
  const responseBody = await response.text();

  const parser = new XMLParser();
  const dom = parser.parse(responseBody) as Response;
  if (!("ocs" in dom)) {
    throw new Error("Invalid response: " + responseBody);
  }
  if (dom.ocs.meta.status === "failure") {
    throw new Error(dom.ocs.meta.statuscode + ": " + dom.ocs.meta.message);
  }
  return dom.ocs.data;
}
export interface Activity {
  activityId: string;
  app: string;
  type: string;
  user: string;
  subject: string;
  // subject_rich: SubjectRich;
  objectType: string;
  objectId: string;
  objectName: string;
  objects: Objects;
  link: string;
  icon: string;
  datetime: string;
}

interface Response {
  ocs: Ocs;
}

interface Ocs {
  meta: Meta;
  data: Data;
}

interface Data {
  element: ActivityElement[];
}

interface ActivityElement {
  activity_id: string;
  app: string;
  type: string;
  user: string;
  subject: string;
  subject_rich: SubjectRich;
  object_type: string;
  object_id: string;
  object_name: string;
  objects: Objects;
  link: string;
  icon: string;
  datetime: string;
}

interface Objects {
  element: string[] | string;
}

interface SubjectRich {
  element: SubjectRichElement[];
}

interface SubjectRichElement {
  _text?: string;
  file1?: File;
  file?: File;
  file2?: File;
  file3?: File;
  newfile?: File;
  oldfile1?: File;
  oldfile2?: File;
  file4?: File;
  file5?: File;
}

interface File {
  type: string;
  id: string;
  name: string;
  path: string;
  link: string;
}

interface Meta {
  status: string;
  statuscode: number;
  message: string;
}
