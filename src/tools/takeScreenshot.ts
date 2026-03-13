import screenshot from 'screenshot-desktop';

export async function takeScreenshot(args: {
  monitor_id?: number;
}): Promise<{ content: Array<{ type: 'image'; data: string; mimeType: string } | { type: 'text'; text: string }> }> {
  try {
    const options: { screen?: number; format?: string } = { format: 'png' };
    if (args.monitor_id !== undefined) {
      options.screen = args.monitor_id;
    }

    const buf: Buffer = await screenshot(options);
    return {
      content: [{ type: 'image', data: buf.toString('base64'), mimeType: 'image/png' }],
    };
  } catch (err: unknown) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }],
    };
  }
}
