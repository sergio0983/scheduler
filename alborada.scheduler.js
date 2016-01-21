Date.prototype.addDays = function(n){
	this.setDate(this.getDate() + n);
	return this;
}
Date.prototype.addMonths = function(n){
	this.setMonth(this.getMonth() + n);
	return this;
}
Date.prototype.addHours = function(h){
	this.setTime(this.getTime() + (h*60*60*1000)); 
	return this;
}
Date.prototype.monday = function(){
	var day = this.getDay();
	var diff = this.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
	var monday = new Date(this);
	monday.setDate(diff);
	return monday;
}
Date.prototype.firstDayOfMonth = function(){
	var day = new Date(this.getFullYear(), this.getMonth(), 1);
	return day;
}
Date.prototype.lastDayOfMonth = function(){
	var day = new Date(this.getFullYear(), this.getMonth()+1, 0);
	return day;
}
Date.__parse = Date.parse;
Date.parse = function(string){
	var pattern = /^\d{1,2}:\d{1,2}/ig;
	
	var today = new Date();
	
	if ( pattern.exec(string) ){
		var year = today.getFullYear();
		var month = today.getMonth()+1;
		var day = today.getDay();
		
		var t = year+"-"+month+"-"+day+" "+string;
		var timestamp = Date.__parse(t);

		return new Date(timestamp);
	}
	else{
		return new Date(Date.__parse(string));
	}
}
Date.prototype.__toString = Date.prototype.toString;
Date.prototype.toString = function(pattern){
	switch(pattern){
		case "HH:mm":{
			return this.getHours().pad(2)+":"+this.getMinutes().pad(2);
		}
		break;
		default: this.__toString();
	}
	
	
}
Number.prototype.pad = function pad(width, char) {
  char = char || '0';
  n = this + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(char) + n;
}
Date.prototype.checkDate = function(__event){
	var startDate = Date.parse(__event.startDate);
	var endDate =  Date.parse(__event.endDate);
	
	if ( typeof __event.startDate != "undefined" && ( 
		startDate.getYear() > this.getYear() || 
		( startDate.getYear() == this.getYear() && startDate.getMonth() > this.getMonth() ) ||  
		( startDate.getYear() == this.getYear() && startDate.getMonth() == this.getMonth() && startDate.getDate() > this.getDate() )
	) ) return false;
	if ( typeof __event.endDate != "undefined" && ( 
		endDate.getYear() < this.getYear() || 
		( endDate.getYear() == this.getYear() && endDate.getMonth() < this.getMonth() ) ||  
		( endDate.getYear() == this.getYear() && endDate.getMonth() == this.getMonth() && endDate.getDate() < this.getDate() )
	) ) return false;

	if ( typeof __event.weekDay != "undefined" && this.getDay() != __event.weekDay ) return false;
	if ( typeof __event.monthDay != "undefined" && this.getDate() != __event.monthDay ) return false;
	
	
	
	return true;
}
Date.prototype.checkTime = function(__event){
	var hour = this;
	var nextHour = Date.parse(this.toString("HH:mm")).addHours(1);
	
	if ( typeof __event.startTime == "undefined" ){
		__event.startTime = "00:00:00";
	}
	if ( typeof __event.endTime == "undefined" ){
		__event.endTime = "23:59:59";
	}
	
	
	if ( Date.parse(__event.startTime) < hour || Date.parse(__event.startTime) >= nextHour  ) return false;
	else return true;
}



function Scheduler(params){
	this.id = "scheduler"+uniqid();
	this.today = new Date();

	this.target = params.target;
	this.schedule = params.schedule || "weekly"; //weekly, daily, monthly
	this.events = params.events || [];
	for ( var i = 0;  i < this.events.length; i++ ){
		this.events[i].id = "scheduler_event"+uniqid();
		if ( typeof this.events[i].startTime == "undefined" ) this.events[i].startTime = "00:00";
		if ( typeof this.events[i].endTime == "undefined" ) this.events[i].endTime = "23:59:59";
	}
	this.allowEdit = params.allowEdit || true;
	this.defaultEventName = params.defaultEventName || "Nuevo Horario";

	this.listeners = {
		"maximize":[],
		"minimize":[],
		"eventadded":[],
		"eventremoved":[],
		"beforeShow":[],
		"show":[]
	};	
	this.bind = function(bindTo, func){
		this.listeners[bindTo].push(func);
	};
	
	switch(this.schedule){
		case "daily":{
			this.desde = new Date(this.today);
			this.hasta = new Date(this.today);
		}
		break;
		case "weekly":{
			this.desde = new Date(this.today).monday();
			this.hasta = new Date(this.desde).addDays(7);
		}
		break;
		case "monthly":{
			this.desde = new Date(this.today).firstDayOfMonth();
			this.hasta = new Date(this.desde).lastDayOfMonth();
		}
		break;
	}
	var self = this;

	this.show = function(){
		var h = $(self.target).height();
		var w = $(self.target).width();

		for ( var i=0; i < self.listeners["beforeShow"].length; i++ ){
			self.listeners["beforeShow"][i].call(self, event);
		}

		var html = "" +
		"<div class = 'scheduler "+self.schedule+"' id = '"+self.id+"' style='width:"+w+"px"+"; height:"+h+"px;'>" +
		"	<div class = 'title'>" +
			"	<a class = 'prev'>&#10092</a>" + 
			"	<a class = 'next'>&#10093</a>";
			if ( self.schedule == "weekly" ) html+="<h1>"+self.desde.toLocaleString(window.navigator.language, { year: 'numeric', month: 'short', day: 'numeric' })+" - "+self.hasta.toLocaleString(window.navigator.language, { year: 'numeric', month: 'short', day: 'numeric' })+"</h1>";
			if ( self.schedule == "monthly" ) html+="<h1>"+self.desde.toLocaleString(window.navigator.language, { year: 'numeric'})+", "+self.desde.toLocaleString(window.navigator.language, { month: 'long'})+"</h1>";
			if ( self.schedule == "daily" ) html+="<h1>"+self.desde.toLocaleString(window.navigator.language, { year: 'numeric', month: 'short', day: 'numeric' })+" - "+self.hasta.toLocaleString(window.navigator.language, { year: 'numeric', month: 'short', day: 'numeric' })+"</h1>";

			html+= "" + 
			"	<a class = 'view_month'>Mes</a>" +
			"	<a class = 'view_week'>Semana</a>" +
			"	<a class = 'view_day'>Día</a>" +	
		"	</div>";
		
		
		
		switch(self.schedule){
			case "daily":{
				html+= "<div class = 'scheduler-content'>" + 
				"<table>" +
				"	<tr><th></th>";

				
				weekDayFormat = 'long'
				
				for ( var day = new Date(self.desde), i=0; i < 1; i++ ){
					html+="<th>"+day.toLocaleString(window.navigator.language, {weekday: weekDayFormat});+"</th>";
					day.addDays(1);
				}
				html+="</tr>";

				for ( var hour = Date.parse("00:00"), i=0; i < 24; i++ ){
					html+="<tr><th>"+hour.toString("HH:mm")+"</th>"
		
					for ( var day = new Date(self.desde), j=0; j < 1; j++ ){	
						var events = self.events.filter(function(ev){
							//Comprobamos si estamos en esos días del periodo
							if ( typeof ev.startDate != "undefined" && Date.parse(ev.startDate) > day  ) return false;
							if ( typeof ev.endDate != "undefined" && Date.parse(ev.endDate) < day  ) return false;

							//Comprobamos si cumplimos la hora de inicio
							var nextHour = Date.parse(hour.toString("HH:mm")).addHours(1);
							if ( Date.parse(ev.startTime) < hour || Date.parse(ev.startTime) >= nextHour  ) return false;

							//Comprobamos si cumplimos el día de la semana
							if (day.getDay() != ev.weekDay) return false;
							return true;
						});
						

						html+="<td d='"+day.getDay()+"' h='"+hour.toString("HH:mm")+"'>";

						for ( var index in events ){	
							var ev = events[index];	
							//var h = ev.endTime - ev.startTime								
							html+="<p class = 'event' id='"+ev.id+"'  title = '"+ev.name+"'";
							if (ev.editable) html+=" editable ";
							html+=">"+ev.name;
							if ( ev.editable && self.allowEdit ){
								html+="<a class = 'deleteHour'>&#10005</a>";
							}
							html+="</p>";
						}
						
						
						html+="</td>";
						day.addDays(1);
					}

					html+="</tr>";
					
					hour.addHours(1);
				}
				
				html+="</div>";
			}
			break;
	
			case "monthly":{
				html+= "<div class = 'scheduler-content'>" + 
				"<table>" +
				"	<tr>";

				
				if ( w > 600 ) var weekDayFormat = 'long'
				else  var weekDayFormat = 'short'
			
				
				for ( var day = self.desde.monday(), i=0; i < 7; i++ ){
					html+="<th>"+day.toLocaleString(window.navigator.language, {weekday: weekDayFormat})+"</th>";
					day.addDays(1);
				}
				html+="</tr>";
				
				
				for ( var monday = self.desde.monday(); monday <= self.hasta.monday();  ){
					html+="<tr>";
					for ( var day = monday.monday(), i=0; i < 7; i++ ){
						html+="<td><span class = 'dayOfMonth'>"+day.getDate()+"</span>";

						var events = self.events.filter(function(ev){
							return day.checkDate(ev);
						});
						
						for ( var index in events ){	
							var ev = events[index];							
							html+="<p class = 'event' id='"+ev.id+"' title = '"+ev.name+"'";
							if (ev.editable) html+=" editable ";
							html+=">"+ev.name;
							if ( ev.editable && self.allowEdit ){
								html+="<a class = 'deleteHour'>&#10005</a>";
							}
							html+="</p>";
						}
	
						html+="</td>";
						day.addDays(1);
					}
					html+="</tr>";
					monday.addDays(7);
				}
			}
			break;
	
			case "weekly": default:{
				html+= "<div class = 'scheduler-content'>" + 
				"<table>" +
				"	<tr><th></th>";

				
				if ( w > 600 ) var weekDayFormat = 'long'
				else  var weekDayFormat = 'short'
			
				
				for ( var day = self.desde.monday(), i=0; i < 7; i++ ){
					html+="<th>"+day.toLocaleString(window.navigator.language, {weekday: weekDayFormat})+"</th>";
					day.addDays(1);
				}
				html+="</tr>";

				for ( var hour = Date.parse("00:00"), i=0; i < 24; i++ ){
					html+="<tr><th>"+hour.toString("HH:mm")+"</th>"
		
					for ( var day = self.desde.monday(), j=0; j < 7; j++ ){	
						var events = self.events.filter(function(ev){
							return day.checkDate(ev) && hour.checkTime(ev);
						});
						html+="<td d='"+day.getDay()+"' h='"+hour.toString("HH:mm")+"'>";
						for ( var index in events ){	
							var ev = events[index];
							
							var top = 100*Date.parse(ev.startTime).getMinutes()/60;
							var height = 100*(Date.parse(ev.endTime) - Date.parse(ev.startTime))/(60*60*1000);
							
							//var h = ev.endTime - ev.startTime								
							html+="<p class = 'event' id='"+ev.id+"' title = '"+ev.name+"' style='top:"+top+"%; height: "+height+"%'";
							if (ev.editable) html+=" editable ";
							html+=">"+ev.name;
							if ( ev.editable && self.allowEdit ){
								html+="<a class = 'deleteHour'>&#10005</a>";
							}
							html+="</p>";
						}
						
						
						html+="</td>";
						day.addDays(1);
					}

					html+="</tr>";
					
					hour.addHours(1);
					
				}
				
				html+="</div>";
			}
			break;
		}
			
		html+= "" +
		"</div>";
		
		$(self.target).html(html);
		$("#"+self.id+" .prev").bind("click", function(){
			switch(self.schedule){
				case "weekly":{
					self.desde = new Date(self.desde).addDays(-7);
					self.hasta = new Date(self.hasta).addDays(-7);
				}
				break;
				case "daily":{
					self.desde = new Date(self.desde).addDays(-1);
					self.hasta = new Date(self.hasta).addDays(-1);
				}
				break;
				case "monthly":{
					self.desde = new Date(self.desde).addMonths(-1).firstDayOfMonth();
					self.hasta = new Date(self.desde).lastDayOfMonth();
				}
				break;
			}
			var scrollTop = $(".scheduler-content").scrollTop();
			self.show();
			$(".scheduler-content").scrollTop(scrollTop);
		});
		$("#"+self.id+" .next").bind("click", function(){
			switch(self.schedule){
				case "weekly":{
					self.desde = new Date(self.desde).addDays(7);
					self.hasta = new Date(self.hasta).addDays(7);
				}
				break;
				case "daily":{
					self.desde = new Date(self.desde).addDays(1);
					self.hasta = new Date(self.hasta).addDays(1);
				}
				break;
				case "monthly":{
					self.desde = new Date(self.desde).addMonths(1);
					self.hasta = new Date(self.hasta).addMonths(1);
				}
				break;
			}
			var scrollTop = $(".scheduler-content").scrollTop();
			self.show();
			$(".scheduler-content").scrollTop(scrollTop);
		});
	
		$(".view_month").bind("click", function(){
			self.schedule = "monthly";
			self.desde = new Date(self.today).firstDayOfMonth();
			self.hasta = new Date(self.desde).lastDayOfMonth();
			self.show();
		});
		$(".view_day").bind("click", function(){
			self.schedule = "daily";
			self.desde = new Date(self.today);
			self.hasta = new Date(self.today);
			self.show();
		});
		$(".view_week").bind("click", function(){
			self.schedule = "weekly";
			self.desde = new Date(self.today).monday();
			self.hasta = new Date(self.desde).addDays(7);
			self.show();
		});
	
	
	
		if ( self.allowEdit ){
			$("td[d][h]").bind("click", function(){
				var d = $(this).attr("d");
				var h = $(this).attr("h");

				var startTime = Date.parse(h);
				
				var html="<div data-form class = 'scheduler-form'><table style='width: 100%; float: left; border-spacing: 7px'><tr>";
				for ( var day = self.today.monday(), i=1; i <= 7; i++ ){
					var weekDay = (day.getDay() == 7 ? 0:day.getDay());
					html+="" + 
					"<td><p><input type = 'checkbox' name = 'weekDay' value = '"+weekDay+"' ";
					if ( weekDay == d ) html+=" checked ";
					html+="><label>"+day.toLocaleString(window.navigator.language, {weekday: 'short'})+"</label></p></td>";
					day.addDays(1);
				}
				html+="</tr>";
				html+="<tr><td colspan='7'><p><input type = 'checkbox' name = 'allDays'><label>Todos los días</label></p></td></tr>" + 
					"<tr><td colspan='7'><p><input type = 'checkbox' name = 'labourDays'><label>Días Laborables</label></p></td></tr>";
				html+="<td colspan='3'><p><label>Hora Inicio</label>";
				html+="<select name = 'horas'>";
				for ( var i = 0; i < 24; i++ ){	
					html+="<option value = '"+i.pad(2, 0)+"' ";
					if ( i == Date.parse(h).getHours() ) html+=" selected ";
					html+=" >"+i.pad(2, 0)+"</option>";
				}
				html+="</select>";
				html+="<select name = 'minutos'>";
				for ( var i = 0; i < 60; i++ ){
					html+="<option value = '"+i.pad(2, 0)+"'>"+i.pad(2, 0)+"</option>";
				}
				html+="</select>";
				html+="</p></td>";
				html+="<td></td>";
				html+="<td colspan = '3'><p><label>Hora Fin</label>";
				html+="<select name = 'horas'>";
				for ( var i = 0; i < 24; i++ ){	
					html+="<option value = '"+i.pad(2, 0)+"' ";
					if ( i == Date.parse(h).getHours() + 1 ) html+=" selected ";
					html+=" >"+i.pad(2, 0)+"</option>";
				}
				html+="</select>";
				html+="<select name = 'minutos'>";
				for ( var i = 0; i < 60; i++ ){
					html+="<option value = '"+i.pad(2, 0)+"'>"+i.pad(2, 0)+"</option>";
				}
				html+="</select>";
				html+="</p></td>";
				html+="</tr>";
				html+="<tr><td colspan = '7'><a class = 'button addHours'>Añadir</a></tr>";

				
				if ( w > 600 ) var popupType = 'dialog'
				else var popupType = 'cover'
				
				self.popupEdit = new Popup({type:popupType, target:"#"+self.id, "title":"Añadir Horario", html:html});
				self.popupEdit.bind("show", function(){
					$("#"+self.popupEdit.id+" input[name='allDays']").bind("click", function(){
						if ( $(this).prop("checked") ) $("input[name='weekDay']").prop("checked", true);
						$("#"+self.popupEdit.id+" input[name='labourDays']").prop("checked", false);
					});
					$("#"+self.popupEdit.id+" input[name='labourDays']").bind("click", function(){
						if ( $(this).prop("checked") ){
							$("input[name='weekDay']").each(function(i, el){
								if ( $(el).val() > 0 && $(el).val() < 6 ){
									$(el).prop("checked", true);
								}
								else{
									$(el).prop("checked", false);
								}
							});
							$("#"+self.popupEdit.id+" input[name='allDays']").prop("checked", false);
						}
					});
					$("#"+self.popupEdit.id+" input[name='weekDay']").bind("click", function(){
						$("#"+self.popupEdit.id+" input[name='allDays']").prop("checked", false);
						$("#"+self.popupEdit.id+" input[name='labourDays']").prop("checked", false);
					});

					$("#"+self.popupEdit.id+" a.addHours").bind("click", function(){
						if ( !$("input[name='weekDay']:checked").length ){ alert("Debe seleccionar al menos un día"); return; }
						
						$("input[name='weekDay']:checked").each(function(i, el){
							var event = {
								weekDay:$(el).val(),
								name:self.defaultEventName,
								startTime:$("td:first-child select[name='horas']").val()+":"+$("td:first-child select[name='minutos']").val(),
								endTime:$("td:last-child select[name='horas']").val()+":"+$("td:last-child select[name='minutos']").val(),
								editable:true,
								id:"scheduler_event"+uniqid()
							}
							self.events.push(event);
							for ( var i=0; i < self.listeners["eventadded"].length; i++ ){
								self.listeners["eventadded"][i].call(self, event);
							}
						});
						
						self.popupEdit.bind("hide", function(){
							self.show();
						});
						self.popupEdit.hide();
					});
				});	
				self.popupEdit.show();
			});
		
			$(".deleteHour").bind("click", function(e){
				var id = $(this).parent().attr("id");
				var events = self.events.filter(function(ev){
					if ( ev.id == id ) {
						event = ev;
						return false;
					}
					else return true;
				});
				self.events = events;
				
				for ( var i=0; i < self.listeners["eventremoved"].length; i++ ){
					self.listeners["eventremoved"][i].call(self, event);
				}
				self.show();

				e.stopPropagation();
			});
		}
	}
}























